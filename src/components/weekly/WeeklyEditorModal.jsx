import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Textarea from '../ui/Textarea';
import {
  BLOCKER_SEVERITY_OPTIONS,
  PRIORITY_STATUS_OPTIONS,
  WIN_CATEGORY_OPTIONS,
} from '../../lib/weeklyBriefEditor';

function WeeklyEditorModal({
  isOpen,
  title,
  editorType,
  formValues,
  formError,
  isEditing,
  onClose,
  onSubmit,
  onFormChange,
}) {
  return (
    <Modal isOpen={isOpen} title={title} onClose={onClose}>
      <form className="weekly-form" onSubmit={onSubmit}>
        {editorType === 'priority' ? (
          <>
            <Input
              id="weekly-priority-title"
              label="Priority"
              className="settings-field"
              value={formValues.title || ''}
              onChange={(event) => onFormChange('title', event.target.value)}
              required
            />

            <Input
              id="weekly-priority-owner"
              label="Owner"
              className="settings-field"
              value={formValues.owner || ''}
              onChange={(event) => onFormChange('owner', event.target.value)}
              required
            />

            <label className="settings-field" htmlFor="weekly-priority-status">
              <span className="settings-field__label">Status</span>
              <select
                id="weekly-priority-status"
                className="settings-input"
                value={formValues.status || 'Planned'}
                onChange={(event) => onFormChange('status', event.target.value)}
              >
                {PRIORITY_STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </label>
          </>
        ) : null}

        {editorType === 'win' ? (
          <>
            <Textarea
              id="weekly-win-text"
              label="Win"
              className="settings-field weekly-form__textarea-field"
              value={formValues.text || ''}
              onChange={(event) => onFormChange('text', event.target.value)}
              rows={3}
              required
            />

            <label className="settings-field" htmlFor="weekly-win-category">
              <span className="settings-field__label">Category</span>
              <select
                id="weekly-win-category"
                className="settings-input"
                value={formValues.category || 'Execution'}
                onChange={(event) => onFormChange('category', event.target.value)}
              >
                {WIN_CATEGORY_OPTIONS.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </label>
          </>
        ) : null}

        {editorType === 'blocker' ? (
          <>
            <Textarea
              id="weekly-blocker-text"
              label="Blocker"
              className="settings-field weekly-form__textarea-field"
              value={formValues.text || ''}
              onChange={(event) => onFormChange('text', event.target.value)}
              rows={3}
              required
            />

            <label className="settings-field" htmlFor="weekly-blocker-severity">
              <span className="settings-field__label">Severity</span>
              <select
                id="weekly-blocker-severity"
                className="settings-input"
                value={formValues.severity || 'warning'}
                onChange={(event) => onFormChange('severity', event.target.value)}
              >
                {BLOCKER_SEVERITY_OPTIONS.map((severity) => (
                  <option key={severity} value={severity}>
                    {severity}
                  </option>
                ))}
              </select>
            </label>
          </>
        ) : null}

        {formError ? (
          <p className="helper-text weekly-error" role="alert">
            {formError}
          </p>
        ) : null}

        <div className="weekly-modal-actions">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" icon={{ name: 'action', size: 14 }}>
            {isEditing ? 'Save Changes' : 'Create'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default WeeklyEditorModal;
