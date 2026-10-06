import { newId } from './storage';

// Reads a JSON file and returns sanitized notes. Existing notes are never touched;
// any missing or duplicate id gets a fresh one.
export async function parseImport(file, existing) {
  const data = JSON.parse(await file.text());
  if (!Array.isArray(data)) throw new Error('Invalid file');
  const ids = new Set(existing.map((n) => n.id));
  const now = Date.now();
  const ts = (v) => (Number.isFinite(v) ? v : now);
  return data
    .filter((n) => n && typeof n === 'object')
    .map((n) => {
      const id = typeof n.id === 'string' && n.id && !ids.has(n.id) ? n.id : newId();
      ids.add(id);
      return {
        id,
        title: String(n.title ?? ''),
        content: String(n.content ?? ''),
        createdAt: ts(n.createdAt),
        updatedAt: ts(n.updatedAt),
        isPrivate: !!n.isPrivate,
      };
    });
}
