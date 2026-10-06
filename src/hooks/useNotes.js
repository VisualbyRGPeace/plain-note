import { useState, useEffect, useCallback } from 'react';
import { loadNotes, saveNotes, newId } from '../utils/storage';

export default function useNotes() {
  const [notes, setNotes] = useState(loadNotes);

  useEffect(() => {
    saveNotes(notes);
  }, [notes]);

  const create = useCallback(() => {
    const now = Date.now();
    const note = { id: newId(), title: '', content: '', createdAt: now, updatedAt: now, isPrivate: false };
    setNotes((p) => [note, ...p]);
    return note.id;
  }, []);

  const update = useCallback((id, patch) => {
    setNotes((p) => p.map((n) => (n.id === id ? { ...n, ...patch, updatedAt: Date.now() } : n)));
  }, []);

  const remove = useCallback((id) => setNotes((p) => p.filter((n) => n.id !== id)), []);
  const clear = useCallback(() => setNotes([]), []);
  const add = useCallback((list) => setNotes((p) => [...list, ...p]), []);

  return { notes, create, update, remove, clear, add };
}
