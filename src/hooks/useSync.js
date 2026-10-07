import { useCallback, useEffect, useRef, useState } from 'react';
import { cloudEnabled, watchAuth, signIn, signUp, signOut, getVault, createVault, pull, push } from '../utils/cloud';
import { deriveKey, encrypt, decrypt, newSalt } from '../utils/crypto';

const LS = (k, v) => { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch { return null; } };

// Local-first sync. Last write wins per note; deletes are synced as tombstones.
export default function useSync({ notes, dead, apply }) {
  const [loading, setLoading] = useState(cloudEnabled);
  const [user, setUser] = useState(null);
  const [key, setKey] = useState(null);
  const [hasVault, setHasVault] = useState(null);
  const [status, setStatus] = useState('');
  const state = useRef({});
  state.current = { notes, dead };
  const busy = useRef(false);

  useEffect(() => {
    if (!cloudEnabled) return;
    return watchAuth((u) => {
      setUser(u);
      setLoading(false);
      if (!u) setKey(null);
    });
  }, []);

  useEffect(() => {
    if (!user || key) return;
    setHasVault(null);
    getVault().then((v) => setHasVault(!!v)).catch(() => setHasVault(null));
  }, [user, key]);

  const unlock = async (pass) => {
    const v = await getVault();
    if (!v) {
      const salt = newSalt();
      const k = await deriveKey(pass, salt);
      await createVault(salt, await encrypt(k, { ok: 1 }));
      setKey(k);
      return;
    }
    const k = await deriveKey(pass, v.salt);
    try { await decrypt(k, v.check_blob); } catch { throw new Error('Wrong passphrase.'); }
    setKey(k);
  };

  const syncNow = useCallback(async () => {
    if (!key) return false;
    if (busy.current) return false;
    busy.current = true;
    setStatus('Syncing...');
    try {
      const t0 = Date.now();
      const lastPush = Number(LS('plain_lastpush') || 0);
      let since = LS('plain_lastpull') || null;
      for (;;) {
        const rows = await pull(since);
        if (!rows.length) break;
        const { notes: ln, dead: ld } = state.current;
        const local = new Map(ln.map((n) => [n.id, n]));
        const ups = [];
        const dels = [];
        for (const r of rows) {
          since = r.synced_at;
          const l = local.get(r.id);
          if (r.deleted) { if (l && l.updatedAt <= r.updated_at) dels.push(r.id); continue; }
          if ((ld[r.id] || 0) > r.updated_at) continue;
          if (l && l.updatedAt >= r.updated_at) continue;
          try {
            const d = await decrypt(key, r.data);
            ups.push({ id: r.id, title: d.title, content: d.content, createdAt: d.createdAt, isPrivate: !!d.isPrivate, updatedAt: r.updated_at });
          } catch { /* undecryptable row: skip */ }
        }
        apply(ups, dels);
        if (rows.length < 1000) break;
      }
      const { notes: ln, dead: ld } = state.current;
      const out = [];
      for (const n of ln) {
        if (n.updatedAt > lastPush) {
          out.push({
            id: n.id, deleted: false, updated_at: n.updatedAt,
            data: await encrypt(key, { title: n.title, content: n.content, createdAt: n.createdAt, isPrivate: n.isPrivate }),
          });
        }
      }
      for (const [id, ts] of Object.entries(ld)) if (ts > lastPush) out.push({ id, data: '', deleted: true, updated_at: ts });
      if (out.length) await push(out);
      LS('plain_lastpush', String(t0));
      if (since) LS('plain_lastpull', since);
      setStatus('Synced');
      return true;
    } catch {
      setStatus('Sync failed');
      return false;
    } finally {
      busy.current = false;
    }
  }, [key, apply]);

  useEffect(() => {
    if (!key) return;
    const t = setTimeout(syncNow, 1500);
    return () => clearTimeout(t);
  }, [key, notes, dead, syncNow]);

  useEffect(() => {
    if (!key) return;
    const v = () => document.visibilityState === 'visible' && syncNow();
    document.addEventListener('visibilitychange', v);
    const i = setInterval(v, 60000);
    return () => { document.removeEventListener('visibilitychange', v); clearInterval(i); };
  }, [key, syncNow]);

  const stage = !cloudEnabled ? 'off' : loading ? 'loading' : !user ? 'signedout' : !key ? 'locked' : 'ready';
  return { stage, user, hasVault, status, unlock, syncNow, signIn, signUp, signOut };
}
