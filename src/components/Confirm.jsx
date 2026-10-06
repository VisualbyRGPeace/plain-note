import { useEffect, useRef } from 'react';

export default function Confirm({ title, text, okLabel, onCancel, onOk }) {
  const cancelRef = useRef(null);
  useEffect(() => cancelRef.current?.focus(), []);
  return (
    <div className="overlay" onClick={onCancel}>
      <div className="dialog" role="alertdialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()}>
        <h2>{title}</h2>
        {text && <p>{text}</p>}
        <div className="row">
          <button ref={cancelRef} className="btn" onClick={onCancel}>Cancel</button>
          <button className="btn danger" onClick={onOk}>{okLabel}</button>
        </div>
      </div>
    </div>
  );
}
