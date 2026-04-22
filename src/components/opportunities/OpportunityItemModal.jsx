import Modal from '../ui/Modal';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import { opportunityStageTone } from '../../lib/statusMaps';

function OpportunityItemModal({
  selectedOpportunity,
  isDeleting = false,
  onClose,
  onEdit,
  onDelete,
}) {
  return (
    <Modal
      isOpen={Boolean(selectedOpportunity)}
      title={selectedOpportunity ? selectedOpportunity.name : ''}
      onClose={onClose}
    >
      {selectedOpportunity ? (
        <div className="opportunity-modal-content">
          <p className="helper-text">Company: {selectedOpportunity.company}</p>
          <p className="helper-text">
            Priority: <Badge label={selectedOpportunity.priority} tone={selectedOpportunity.priority.toLowerCase()} />
          </p>
          <p className="helper-text">
            Stage: <Badge label={selectedOpportunity.stage} tone={opportunityStageTone[selectedOpportunity.stage] || 'low'} />
          </p>
          <p className="helper-text">Next step: {selectedOpportunity.nextStep}</p>
          <div className="opportunity-modal-actions">
            <Button
              type="button"
              onClick={onEdit}
              aria-label="Edit selected opportunity"
              icon={{ name: 'edit', size: 14 }}
            >
              Edit
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={onDelete}
              disabled={isDeleting}
              aria-label="Delete selected opportunity"
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

export default OpportunityItemModal;
