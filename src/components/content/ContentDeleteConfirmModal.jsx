import DeleteConfirmModal from '../ui/DeleteConfirmModal';

function ContentDeleteConfirmModal({
  isOpen,
  message,
  isDeleting = false,
  onCancel,
  onConfirm,
}) {
  return (
    <DeleteConfirmModal
      isOpen={isOpen}
      title="Delete Content Item"
      message={message}
      onCancel={onCancel}
      onConfirm={onConfirm}
      isDeleting={isDeleting}
    />
  );
}

export default ContentDeleteConfirmModal;
