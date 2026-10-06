const KEY = 'plain_notes';

// serialize/deserialize are the ONLY place notes touch storage.
// To add real encryption for private notes later, change them here.
const serialize = (notes) => JSON.stringify(notes);
const deserialize = (raw) => JSON.parse(raw);

export function loadNotes() {
  try {
    const raw = localStorage.getItem(KEY);
    const data = raw ? deserialize(raw) : [];
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export function saveNotes(notes) {
  try {
    localStorage.setItem(KEY, serialize(notes));
    return true;
  } catch {
    return false;
  }
}

export const newId = () =>
  crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2);
