import { useRef, useState } from 'react';
import Confirm from './Confirm';
import { exportNotes } from '../utils/exportNotes';
import { parseImport } from '../utils/importNotes';

const THEMES = [['system', 'System'], ['light', 'Light'], ['dark', 'Dark']];

export default function Settings({ theme, setTheme, notes, onImport, onClear, onClose }) {
  const [confirm, setConfirm] = useState(false);
  const [msg, setMsg] = useState('');
  const file = useRef(null);

  const pick = async (e) => {
    const f = e.target.files[0];
    e.target.value = '';
    if (!f) return;
    try {
      const list = await parseImport(f, notes);
      onImport(list);
      setMsg(`Imported ${list.length} notes.`);
    } catch {
      setMsg('Could not read this file. Choose a plain-notes.json export.');
    }
  };

  return (
    <div className="overlay" onClick={onClose}>
      <div className="sheet" role="dialog" aria-modal="true" aria-label="Settings" onClick={(e) => e.stopPropagation()}>
        <div className="row between">
          <h2>Settings</h2>
          <button className="txt" onClick={onClose}>Close</button>
        </div>
        <p className="muted">Your notes are stored locally in this browser.</p>

        <h3>Appearance</h3>
        <div className="row">
          {THEMES.map(([v, label]) => (
            <button key={v} className={'btn' + (theme === v ? ' on' : '')} aria-pressed={theme === v} onClick={() => setTheme(v)}>{label}</button>
          ))}
        </div>

        <h3>Data</h3>
        <div className="row wrap">
          <button className="btn" onClick={() => exportNotes(notes)} disabled={!notes.length}>Export notes</button>
          <button className="btn" onClick={() => file.current?.click()}>Import notes</button>
          <button className="btn danger" onClick={() => setConfirm(true)} disabled={!notes.length}>Clear all notes</button>
          <input ref={file} type="file" accept="application/json,.json" hidden onChange={pick} />
        </div>
        {msg && <p className="muted" role="status">{msg}</p>}

        <h3>About</h3>
        <p className="muted">Plain · Version 1.0</p>
      </div>
      {confirm && (
        <Confirm
          title="Delete all notes?"
          text="This cannot be undone."
          okLabel="Delete all"
          onCancel={() => setConfirm(false)}
          onOk={() => { onClear(); setConfirm(false); onClose(); }}
        />
      )}
    </div>
  );
}
