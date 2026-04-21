import Modal from './Modal';
import Button from './Button';

function DeleteConfirmModal({
  isOpen,
  title = 'Confirm Delete',
  message,
  onCancel,
  onConfirm,
  isDeleting = false,
}) {
  return (
    <Modal isOpen={isOpen} title={title} onClose={onCancel}>
      <p className="helper-text">{message}</p>
      <div className="modal-actions">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={isDeleting} aria-label="Cancel delete">
          Cancel
        </Button>
        <Button
          type="button"
          onClick={onConfirm}
          disabled={isDeleting}
          aria-label="Confirm delete"
          icon={{ name: 'action', size: 14 }}
        >
          {isDeleting ? 'Deleting...' : 'Delete'}
        </Button>
      </div>
    </Modal>
  );
}

export default DeleteConfirmModal;
