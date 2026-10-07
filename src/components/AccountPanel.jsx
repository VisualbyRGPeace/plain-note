import { useState } from 'react';

export default function AccountPanel({ sync, onWipe }) {
  const { stage, user, hasVault, status } = sync;
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [pp, setPp] = useState('');
  const [pp2, setPp2] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  const run = async (fn) => {
    setBusy(true);
    setMsg('');
    try { await fn(); } catch (e) { setMsg(e.message || 'Something went wrong.'); } finally { setBusy(false); }
  };

  if (stage === 'loading') return null;
  if (stage === 'off') {
    return (<><h3>Sync</h3><p className="muted">Cloud sync is not set up. See the README to turn it on.</p></>);
  }

  let body;
  if (stage === 'signedout') {
    body = (
      <form className="stack" onSubmit={(e) => { e.preventDefault(); run(() => sync.signIn(email, pw)); }}>
        <input className="field" type="email" placeholder="Email" aria-label="Email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        <input className="field" type="password" placeholder="Account password" aria-label="Account password" autoComplete="current-password" required minLength={8} value={pw} onChange={(e) => setPw(e.target.value)} />
        <div className="row">
          <button className="btn on" disabled={busy}>Sign in</button>
          <button type="button" className="btn" disabled={busy}
            onClick={() => run(async () => { const ok = await sync.signUp(email, pw); if (!ok) setMsg('Check your email to confirm, then sign in.'); })}>
            Create account
          </button>
        </div>
      </form>
    );
  } else if (stage === 'locked') {
    const first = hasVault === false;
    body = (
      <form className="stack" onSubmit={(e) => {
        e.preventDefault();
        if (first && pp.length < 8) return setMsg('Use at least 8 characters.');
        if (first && pp !== pp2) return setMsg('Passphrases do not match.');
        run(() => sync.unlock(pp));
      }}>
        <p className="muted">
          {first
            ? 'Create an encryption passphrase. Your notes are encrypted on this device with it. If you forget it, cloud notes cannot be recovered.'
            : 'Enter your encryption passphrase to sync.'}
        </p>
        <input className="field" type="password" placeholder="Encryption passphrase" aria-label="Encryption passphrase" autoComplete="off" value={pp} onChange={(e) => setPp(e.target.value)} />
        {first && <input className="field" type="password" placeholder="Repeat passphrase" aria-label="Repeat passphrase" autoComplete="off" value={pp2} onChange={(e) => setPp2(e.target.value)} />}
        <div className="row">
          <button className="btn on" disabled={busy || hasVault === null || !pp}>Unlock</button>
          <button type="button" className="btn" disabled={busy} onClick={() => run(() => sync.signOut())}>Sign out</button>
        </div>
      </form>
    );
  } else {
    body = (
      <>
        <p className="muted">{user.email} · {status || 'Synced'}</p>
        <div className="row">
          <button className="btn" onClick={() => sync.syncNow()}>Sync now</button>
          <button className="btn danger" disabled={busy}
            onClick={() => run(async () => {
              if (!(await sync.syncNow())) throw new Error('Sync failed. Check your connection before signing out.');
              await sync.signOut();
              onWipe();
            })}>
            Sign out
          </button>
        </div>
        <p className="muted">Signing out removes notes from this device. They stay in your cloud.</p>
      </>
    );
  }

  return (
    <>
      <h3>Sync</h3>
      {body}
      {msg && <p className="muted" role="status">{msg}</p>}
    </>
  );
}
