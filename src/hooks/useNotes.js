import { useState, useEffect, useCallback, useRef } from 'react';
import { loadNotes, saveNotes, newId } from '../utils/storage';

const DEAD = 'plain_deleted'; // tombstones { id: deletedAt } so deletes can sync

export default function useNotes() {
  const [notes, setNotes] = useState(loadNotes);
  const [dead, setDead] = useState(() => {
    try { return JSON.parse(localStorage.getItem(DEAD)) || {}; } catch { return {}; }
  });
  const ref = useRef(notes);
  ref.current = notes;

  useEffect(() => { saveNotes(notes); }, [notes]);
  useEffect(() => { try { localStorage.setItem(DEAD, JSON.stringify(dead)); } catch { /* ignore */ } }, [dead]);

  const create = useCallback(() => {
    const now = Date.now();
    const note = { id: newId(), title: '', content: '', createdAt: now, updatedAt: now, isPrivate: false };
    setNotes((p) => [note, ...p]);
    return note.id;
  }, []);

  const update = useCallback((id, patch) => {
    setNotes((p) => p.map((n) => (n.id === id ? { ...n, ...patch, updatedAt: Date.now() } : n)));
  }, []);

  const remove = useCallback((id) => {
    setNotes((p) => p.filter((n) => n.id !== id));
    setDead((d) => ({ ...d, [id]: Date.now() }));
  }, []);

  const clear = useCallback(() => {
    const now = Date.now();
    setDead((d) => ({ ...d, ...Object.fromEntries(ref.current.map((n) => [n.id, now])) }));
    setNotes([]);
  }, []);

  const add = useCallback((list) => setNotes((p) => [...list, ...p]), []);

  // Apply changes pulled from the cloud (no tombstone is re-pushed: ts 0).
  const apply = useCallback((ups, dels) => {
    if (!ups.length && !dels.length) return;
    setNotes((p) => {
      const m = new Map(p.map((n) => [n.id, n]));
      dels.forEach((id) => m.delete(id));
      ups.forEach((n) => m.set(n.id, n));
      return [...m.values()];
    });
    setDead((d) => {
      const x = { ...d };
      dels.forEach((id) => { x[id] = x[id] ?? 0; });
      ups.forEach((n) => delete x[n.id]);
      return x;
    });
  }, []);

  // Remove everything from this device (used on sign out).
  const wipe = useCallback(() => {
    setNotes([]);
    setDead({});
    try { localStorage.removeItem('plain_lastpush'); localStorage.removeItem('plain_lastpull'); } catch { /* ignore */ }
  }, []);

  return { notes, dead, create, update, remove, clear, add, apply, wipe };
}
