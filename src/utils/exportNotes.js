export function exportNotes(notes) {
  const blob = new Blob([JSON.stringify(notes, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'plain-notes.json';
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
