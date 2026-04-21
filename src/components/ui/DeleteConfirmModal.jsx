import ConfirmModal from './ConfirmModal';

function DeleteConfirmModal({
  isOpen,
  title = 'Confirm Delete',
  message,
  onCancel,
  onConfirm,
  isDeleting = false,
}) {
  return (
    <ConfirmModal
      isOpen={isOpen}
      title={title}
      message={message}
      onCancel={onCancel}
      onConfirm={onConfirm}
      isConfirming={isDeleting}
      cancelLabel="Cancel"
      confirmLabel={isDeleting ? 'Deleting...' : 'Delete'}
      cancelAriaLabel="Cancel delete"
      confirmAriaLabel="Confirm delete"
    />
  );
}

export default DeleteConfirmModal;
