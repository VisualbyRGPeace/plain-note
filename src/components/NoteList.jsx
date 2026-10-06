import { memo } from 'react';

function formatTime(ts) {
  const d = new Date(ts);
  const n = new Date();
  const day = (x) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diff = Math.round((day(n) - day(d)) / 864e5);
  if (diff <= 0) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (diff === 1) return 'Yesterday';
  return d.toLocaleDateString([], {
    day: 'numeric',
    month: 'short',
    year: d.getFullYear() !== n.getFullYear() ? 'numeric' : undefined,
  });
}

const NoteItem = memo(function NoteItem({ note, onOpen }) {
  return (
    <li>
      <button className="item" onClick={() => onOpen(note.id)}>
        <span className="t">{note.title.trim() || 'Untitled'}{note.isPrivate ? ' 🔒' : ''}</span>
        <span className="p">{note.content.trim().slice(0, 120) || 'No content'}</span>
        <time className="d">{formatTime(note.updatedAt)}</time>
      </button>
    </li>
  );
});

export default function NoteList({ notes, onOpen }) {
  return (
    <ul className="list">
      {notes.map((n) => <NoteItem key={n.id} note={n} onOpen={onOpen} />)}
    </ul>
  );
}
