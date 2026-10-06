export default function Header({ onSearch, onSettings }) {
  return (
    <header className="bar">
      <h1>Plain</h1>
      <div>
        <button className="ib" aria-label="Search notes" onClick={onSearch}>🔍</button>
        <button className="ib" aria-label="Settings" onClick={onSettings}>⚙</button>
      </div>
    </header>
  );
}
