import { useEffect, useMemo, useRef, useState } from 'react';
import useNotes from './hooks/useNotes';
import useSync from './hooks/useSync';
import Header from './components/Header';
import NoteList from './components/NoteList';
import NoteEditor from './components/NoteEditor';
import EmptyState from './components/EmptyState';
import Settings from './components/Settings';

function useTheme() {
  const [theme, setTheme] = useState(() => {
    try { return localStorage.getItem('plain_theme') || 'system'; } catch { return 'system'; }
  });
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try { localStorage.setItem('plain_theme', theme); } catch { /* ignore */ }
  }, [theme]);
  return [theme, setTheme];
}

export default function App() {
  const { notes, dead, create, update, remove, clear, add, apply, wipe } = useNotes();
  const sync = useSync({ notes, dead, apply });
  const [openId, setOpenId] = useState(null);
  const [query, setQuery] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [theme, setTheme] = useTheme();
  const searchRef = useRef(null);

  const sorted = useMemo(() => [...notes].sort((a, b) => b.updatedAt - a.updatedAt), [notes]);
  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? sorted.filter((n) => (n.title + '\n' + n.content).toLowerCase().includes(q)) : sorted;
  }, [sorted, query]);

  const open = notes.find((n) => n.id === openId);
  const newNote = () => setOpenId(create());

  useEffect(() => {
    if (open) return;
    const h = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchRef.current?.focus();
      } else if (e.key === 'Escape' && showSettings) {
        setShowSettings(false);
      } else if (
        e.key.toLowerCase() === 'n' && !e.metaKey && !e.ctrlKey && !e.altKey && !showSettings &&
        !['INPUT', 'TEXTAREA'].includes(e.target.tagName)
      ) {
        e.preventDefault();
        setOpenId(create());
      }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [open, showSettings, create]);

  if (open) {
    return (
      <NoteEditor
        key={open.id}
        note={open}
        onChange={update}
        onClose={() => setOpenId(null)}
        onDelete={(id) => { remove(id); setOpenId(null); }}
      />
    );
  }

  return (
    <main className="home">
      <Header onSearch={() => searchRef.current?.focus()} onSettings={() => setShowSettings(true)} />
      <input
        ref={searchRef}
        className="search"
        type="search"
        placeholder="Search notes..."
        aria-label="Search notes"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      {shown.length ? <NoteList notes={shown} onOpen={setOpenId} /> : <EmptyState searching={!!query.trim()} />}
      <button className="fab" aria-label="New note" onClick={newNote}>＋</button>
      {showSettings && (
        <Settings
          theme={theme}
          setTheme={setTheme}
          notes={notes}
          sync={sync}
          onWipe={wipe}
          onImport={add}
          onClear={clear}
          onClose={() => setShowSettings(false)}
        />
      )}
    </main>
  );
}
