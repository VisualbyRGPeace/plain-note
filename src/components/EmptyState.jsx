export default function EmptyState({ searching }) {
  if (searching) return <p className="empty">No notes found.</p>;
  return (
    <div className="empty">
      <p>No notes yet.</p>
      <p>Write something down.</p>
    </div>
  );
}
