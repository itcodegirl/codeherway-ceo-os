import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Select from '../ui/Select';

const STATUS_OPTIONS = ['Drafting', 'Editing', 'Scheduled'];

function ContentFormModal({
  isOpen,
  selectedItem,
  isSaving = false,
  formValues,
  formError,
  onClose,
  onChange,
  onSubmit,
}) {
  const values = formValues || {
    title: '',
    platform: '',
    status: 'Drafting',
  };

  return (
    <Modal
      isOpen={isOpen}
      title={selectedItem ? 'Edit Content Item' : 'Add Content Item'}
      onClose={onClose}
    >
      <form className="content-form" onSubmit={onSubmit}>
        <Input
          id="content-title"
          label="Title"
          className="form-field"
          value={values.title}
          onChange={(event) => onChange('title', event.target.value)}
          required
          disabled={isSaving}
        />

        <Input
          id="content-platform"
          label="Platform"
          className="form-field"
          value={values.platform}
          onChange={(event) => onChange('platform', event.target.value)}
          required
          disabled={isSaving}
        />

        <Select
          id="content-status"
          label="Status"
          className="form-field"
          value={values.status}
          onChange={(event) => onChange('status', event.target.value)}
          disabled={isSaving}
        >
          {STATUS_OPTIONS.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </Select>

        {formError ? (
          <p className="helper-text content-error" role="alert">
            {formError}
          </p>
        ) : null}

        <div className="content-modal-actions">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={isSaving}
            aria-label="Cancel content form"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSaving}
            aria-label={selectedItem ? 'Save content changes' : 'Create content item'}
            icon={{ name: 'check', size: 14 }}
          >
            {isSaving ? 'Saving...' : selectedItem ? 'Save Changes' : 'Create Content'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default ContentFormModal;
