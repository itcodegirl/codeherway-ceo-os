import Modal from '../ui/Modal';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import { contentStatusTone } from '../../lib/statusMaps';

function ContentItemModal({
  selectedItem,
  isDeleting = false,
  onClose,
  onEdit,
  onDelete,
}) {
  return (
    <Modal
      isOpen={Boolean(selectedItem)}
      title={selectedItem ? selectedItem.title : ''}
      onClose={onClose}
    >
      {selectedItem ? (
        <div className="content-modal-content">
          <p className="helper-text">Platform: {selectedItem.platform}</p>
          <p className="helper-text">
            Status: <Badge label={selectedItem.status} tone={contentStatusTone[selectedItem.status] || 'default'} />
          </p>
          <div className="content-modal-actions">
            <Button
              type="button"
              onClick={onEdit}
              aria-label="Edit selected content item"
              icon={{ name: 'edit', size: 14 }}
            >
              Edit
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={onDelete}
              disabled={isDeleting}
              aria-label="Delete selected content item"
              icon={{ name: 'delete', size: 14 }}
            >
              Delete
            </Button>
          </div>
        </div>
      ) : null}
    </Modal>
  );
}

export default ContentItemModal;
