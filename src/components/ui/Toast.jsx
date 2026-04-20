function Toast({ isVisible, message, label = 'Status message', className = '' }) {
  if (!isVisible || !message) {
    return null;
  }

  return (
    <div
      className={`toast ${className}`.trim()}
      role="status"
      aria-live="polite"
      aria-atomic="true"
      aria-label={label}
    >
      {message}
    </div>
  );
}

export default Toast;
