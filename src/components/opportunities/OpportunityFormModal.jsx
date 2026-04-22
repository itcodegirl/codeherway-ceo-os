import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Textarea from '../ui/Textarea';

const PRIORITY_OPTIONS = ['High', 'Medium', 'Low'];
const STAGE_OPTIONS = ['In Progress', 'Awaiting Reply', 'New'];

function OpportunityFormModal({
  isOpen,
  selectedOpportunity,
  isSaving = false,
  formValues,
  formError,
  onClose,
  onChange,
  onSubmit,
}) {
  const values = formValues || {
    name: '',
    company: '',
    priority: 'Medium',
    stage: 'New',
    nextStep: '',
  };

  return (
    <Modal
      isOpen={isOpen}
      title={selectedOpportunity ? 'Edit Opportunity' : 'Add Opportunity'}
      onClose={onClose}
    >
      <form className="opportunity-form" onSubmit={onSubmit}>
        <Input
          id="opportunity-name"
          label="Opportunity"
          className="form-field"
          value={values.name}
          onChange={(event) => onChange('name', event.target.value)}
          required
          disabled={isSaving}
        />

        <Input
          id="opportunity-company"
          label="Company"
          className="form-field"
          value={values.company}
          onChange={(event) => onChange('company', event.target.value)}
          required
          disabled={isSaving}
        />

        <Select
          id="opportunity-priority"
          label="Priority"
          className="form-field"
          value={values.priority}
          onChange={(event) => onChange('priority', event.target.value)}
          disabled={isSaving}
        >
          {PRIORITY_OPTIONS.map((priority) => (
            <option key={priority} value={priority}>
              {priority}
            </option>
          ))}
        </Select>

        <Select
          id="opportunity-stage"
          label="Stage"
          className="form-field"
          value={values.stage}
          onChange={(event) => onChange('stage', event.target.value)}
          disabled={isSaving}
        >
          {STAGE_OPTIONS.map((stage) => (
            <option key={stage} value={stage}>
              {stage}
            </option>
          ))}
        </Select>

        <Textarea
          id="opportunity-next-step"
          label="Next Step"
          className="form-field opportunity-form__textarea-field"
          value={values.nextStep}
          onChange={(event) => onChange('nextStep', event.target.value)}
          required
          disabled={isSaving}
          rows={3}
        />

        {formError ? (
          <p className="helper-text opportunities-error" role="alert">
            {formError}
          </p>
        ) : null}

        <div className="opportunity-modal-actions">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={isSaving}
            aria-label="Cancel opportunity form"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSaving}
            aria-label={selectedOpportunity ? 'Save opportunity changes' : 'Create opportunity'}
            icon={{ name: 'check', size: 14 }}
          >
            {isSaving ? 'Saving...' : selectedOpportunity ? 'Save Changes' : 'Create Opportunity'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default OpportunityFormModal;
