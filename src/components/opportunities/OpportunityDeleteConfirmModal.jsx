import DeleteConfirmModal from '../ui/DeleteConfirmModal';

function OpportunityDeleteConfirmModal({
  isOpen,
  message,
  isDeleting = false,
  onCancel,
  onConfirm,
}) {
  return (
    <DeleteConfirmModal
      isOpen={isOpen}
      title="Delete Opportunity"
      message={message}
      onCancel={onCancel}
      onConfirm={onConfirm}
      isDeleting={isDeleting}
    />
  );
}

export default OpportunityDeleteConfirmModal;
