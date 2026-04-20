function Modal({ isOpen, title, onClose, children }) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-label={title || 'Dialog'}>
      <div className="modal-panel">
        <header className="modal-panel__header">
          <h3>{title}</h3>
          <button
            type="button"
            className="action-button action-button--small"
            onClick={onClose}
            aria-label="Close dialog"
          >
            Close
          </button>
        </header>
        <div className="modal-panel__body">{children}</div>
      </div>
    </div>
  );
}

export default Modal;
