import { ToastContext, useStandaloneToast } from '../../hooks/useToast';
import Toast from './Toast';

// Wraps the app shell with a single shared toast instance and renders one
// canonical <Toast> region. All call sites that use `useToast()` see this
// shared state, so a deep page action and the offline-queue-drain handler
// in the shell cannot compete with each other for screen real estate.
function ToastProvider({ children, durationMs }) {
  const value = useStandaloneToast(durationMs);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <Toast
        className="toast--shell"
        isVisible={value.isToastVisible}
        message={value.toastMessage}
      />
    </ToastContext.Provider>
  );
}

export default ToastProvider;
