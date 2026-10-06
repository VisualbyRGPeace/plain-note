import { useEffect, useRef, useState } from 'react';
import Confirm from './Confirm';

export default function NoteEditor({ note, onChange, onClose, onDelete }) {
  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState(note.content);
  const [priv, setPriv] = useState(note.isPrivate);
  const [status, setStatus] = useState('Saved');
  const [confirming, setConfirming] = useState(false);
  const saved = useRef({ title: note.title, content: note.content, priv: note.isPrivate });
  const latest = useRef({});
  latest.current = { title, content, priv };
  const titleRef = useRef(null);
  const bodyRef = useRef(null);

  useEffect(() => {
    (note.title || note.content ? bodyRef : titleRef).current?.focus();
  }, []);

  const dirty = (v) =>
    v.title !== saved.current.title || v.content !== saved.current.content || v.priv !== saved.current.priv;

  const flush = (v) => {
    onChange(note.id, { title: v.title, content: v.content, isPrivate: v.priv });
    saved.current = v;
  };

  // Auto save (debounced)
  useEffect(() => {
    const v = { title, content, priv };
    if (!dirty(v)) return;
    setStatus('Saving...');
    const t = setTimeout(() => {
      flush(v);
      setStatus('Saved');
    }, 400);
    return () => clearTimeout(t);
  }, [title, content, priv]);

  const done = () => {
    const v = latest.current;
    if (!v.title.trim() && !v.content.trim()) onDelete(note.id); // never keep empty notes
    else if (dirty(v)) flush(v);
    onClose();
  };
  const doneRef = useRef(done);
  doneRef.current = done;

  useEffect(() => {
    const h = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        confirming ? setConfirming(false) : doneRef.current();
      } else if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        doneRef.current();
      }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [confirming]);

  return (
    <main className="editor">
      <header className="bar">
        <button className="txt" onClick={done}>← Back</button>
        <span className="status" aria-live="polite">{status}</span>
        <button className="txt strong" onClick={done}>Done</button>
      </header>
      <input
        ref={titleRef}
        className="title"
        placeholder="Title"
        aria-label="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); bodyRef.current?.focus(); } }}
      />
      <textarea
        ref={bodyRef}
        className="body"
        placeholder="Content..."
        aria-label="Content"
        value={content}
        onChange={(e) => setContent(e.target.value)}
      />
      <footer className="foot">
        <label className="priv">
          <input type="checkbox" checked={priv} onChange={(e) => setPriv(e.target.checked)} /> Private note 🔒
        </label>
        <button className="txt danger-t" onClick={() => setConfirming(true)}>Delete</button>
      </footer>
      {priv && <p className="hint">Private is a label only. The text is not encrypted.</p>}
      {confirming && (
        <Confirm title="Delete this note?" okLabel="Delete" onCancel={() => setConfirming(false)} onOk={() => onDelete(note.id)} />
      )}
    </main>
  );
}
