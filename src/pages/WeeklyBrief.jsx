import { useState } from 'react';
import { weeklyPriorities as defaultPriorities, weeklyWins as defaultWins, weeklyBlockers as defaultBlockers } from '../data/mockData';
import SectionCard from '../components/ui/SectionCard';
import PageHeader from '../components/ui/PageHeader';
import WeeklyPriorities from '../components/weekly/WeeklyPriorities';
import Modal from '../components/ui/Modal';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Textarea from '../components/ui/Textarea';
import { usePersistentState } from '../hooks/usePersistentState';
import '../styles/weekly.css';

const PRIORITY_STATUS_OPTIONS = ['Planned', 'In Progress', 'Blocked'];
const WIN_CATEGORY_OPTIONS = ['Product', 'Execution', 'Engineering'];
const BLOCKER_SEVERITY_OPTIONS = ['warning', 'high'];

const DEFAULT_EDITOR_STATE = {
  type: '',
  itemId: '',
};

function buildItemId(prefix) {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}`;
}

function getDefaultFormValues(type) {
  switch (type) {
    case 'priority':
      return {
        title: '',
        owner: 'Jenna',
        status: 'Planned',
      };
    case 'win':
      return {
        text: '',
        category: 'Execution',
      };
    case 'blocker':
      return {
        text: '',
        severity: 'warning',
      };
    default:
      return {};
  }
}

function WeeklyBrief() {
  const [storedPriorities, setStoredPriorities] = usePersistentState('ceo-os-weekly-priorities', defaultPriorities);
  const [storedWins, setStoredWins] = usePersistentState('ceo-os-weekly-wins', defaultWins);
  const [storedBlockers, setStoredBlockers] = usePersistentState('ceo-os-weekly-blockers', defaultBlockers);
  const [editorState, setEditorState] = useState(DEFAULT_EDITOR_STATE);
  const [formValues, setFormValues] = useState({});
  const [formError, setFormError] = useState('');

  const priorityItems = Array.isArray(storedPriorities) ? storedPriorities : defaultPriorities;
  const winItems = Array.isArray(storedWins) ? storedWins : defaultWins;
  const blockerItems = Array.isArray(storedBlockers) ? storedBlockers : defaultBlockers;

  const isEditorOpen = Boolean(editorState.type);
  const isEditing = Boolean(editorState.itemId);

  const openCreateEditor = (type) => {
    setEditorState({ type, itemId: '' });
    setFormValues(getDefaultFormValues(type));
    setFormError('');
  };

  const openEditEditor = (type, item) => {
    setEditorState({ type, itemId: String(item.id) });

    if (type === 'priority') {
      setFormValues({
        title: item.title || '',
        owner: item.owner || 'Jenna',
        status: item.status || 'Planned',
      });
    }

    if (type === 'win') {
      setFormValues({
        text: item.text || '',
        category: item.category || 'Execution',
      });
    }

    if (type === 'blocker') {
      setFormValues({
        text: item.text || '',
        severity: item.severity || 'warning',
      });
    }

    setFormError('');
  };

  const closeEditor = () => {
    setEditorState(DEFAULT_EDITOR_STATE);
    setFormValues({});
    setFormError('');
  };

  const handleFormChange = (field, value) => {
    setFormValues((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleDelete = (type, item) => {
    const itemName = type === 'priority' ? item.title : item.text;
    const shouldDelete = window.confirm(`Delete "${itemName}"? This cannot be undone.`);
    if (!shouldDelete) {
      return;
    }

    if (type === 'priority') {
      setStoredPriorities((current) =>
        (Array.isArray(current) ? current : defaultPriorities).filter((entry) => String(entry.id) !== String(item.id)),
      );
      return;
    }

    if (type === 'win') {
      setStoredWins((current) =>
        (Array.isArray(current) ? current : defaultWins).filter((entry) => String(entry.id) !== String(item.id)),
      );
      return;
    }

    setStoredBlockers((current) =>
      (Array.isArray(current) ? current : defaultBlockers).filter((entry) => String(entry.id) !== String(item.id)),
    );
  };

  const handleEditorSubmit = (event) => {
    event.preventDefault();

    if (editorState.type === 'priority') {
      const title = (formValues.title || '').trim();
      const owner = (formValues.owner || '').trim();
      const status = formValues.status || 'Planned';

      if (!title || !owner) {
        setFormError('Title and owner are required.');
        return;
      }

      const payload = {
        id: editorState.itemId || buildItemId('priority'),
        title,
        owner,
        status,
      };

      setStoredPriorities((current) => {
        const items = Array.isArray(current) ? current : defaultPriorities;
        if (!editorState.itemId) {
          return [payload, ...items];
        }

        return items.map((entry) => (String(entry.id) === String(editorState.itemId) ? payload : entry));
      });

      closeEditor();
      return;
    }

    if (editorState.type === 'win') {
      const text = (formValues.text || '').trim();
      const category = (formValues.category || '').trim() || 'Execution';

      if (!text) {
        setFormError('Win text is required.');
        return;
      }

      const payload = {
        id: editorState.itemId || buildItemId('win'),
        text,
        category,
      };

      setStoredWins((current) => {
        const items = Array.isArray(current) ? current : defaultWins;
        if (!editorState.itemId) {
          return [payload, ...items];
        }

        return items.map((entry) => (String(entry.id) === String(editorState.itemId) ? payload : entry));
      });

      closeEditor();
      return;
    }

    if (editorState.type === 'blocker') {
      const text = (formValues.text || '').trim();
      const severity = formValues.severity || 'warning';

      if (!text) {
        setFormError('Blocker text is required.');
        return;
      }

      const payload = {
        id: editorState.itemId || buildItemId('blocker'),
        text,
        severity,
      };

      setStoredBlockers((current) => {
        const items = Array.isArray(current) ? current : defaultBlockers;
        if (!editorState.itemId) {
          return [payload, ...items];
        }

        return items.map((entry) => (String(entry.id) === String(editorState.itemId) ? payload : entry));
      });

      closeEditor();
    }
  };

  const editorTitle = editorState.type === 'priority'
    ? isEditing
      ? 'Edit Priority'
      : 'Add Priority'
    : editorState.type === 'win'
      ? isEditing
        ? 'Edit Win'
        : 'Add Win'
      : isEditing
        ? 'Edit Blocker'
        : 'Add Blocker';

  return (
    <section className="weekly-page">
      <PageHeader
        title="Weekly Brief"
        description="A weekly planning and review checkpoint to keep momentum explicit."
      />

      <p className="helper-text weekly-source-note" role="status" aria-live="polite">
        Data source: local persistent storage in this browser.
      </p>

      <div className="weekly-overview">
        <article className="summary-card">
          <p className="summary-card__label">Active Priorities</p>
          <h3 className="summary-card__value">{priorityItems.length}</h3>
          <p className="helper-text">Priorities currently scheduled across roles, content, and partnerships.</p>
        </article>

        <article className="summary-card">
          <p className="summary-card__label">Wins This Week</p>
          <h3 className="summary-card__value">{winItems.length}</h3>
          <p className="helper-text">Progress markers you can cite in a status update.</p>
        </article>

        <article className="summary-card">
          <p className="summary-card__label">Open Blockers</p>
          <h3 className="summary-card__value">{blockerItems.length}</h3>
          <p className="helper-text">Risks that need active follow-up.</p>
        </article>
      </div>

      <div className="weekly-grid">
        <SectionCard
          title="Priority Track"
          actionText="Add Priority"
          onAction={() => openCreateEditor('priority')}
          actionLabel="Add weekly priority"
        >
          {priorityItems.length ? (
            <WeeklyPriorities
              items={priorityItems}
              onEditItem={(item) => openEditEditor('priority', item)}
              onDeleteItem={(item) => handleDelete('priority', item)}
            />
          ) : (
            <p className="helper-text">No priorities yet. Add one to define this week&apos;s focus.</p>
          )}
        </SectionCard>

        <SectionCard
          title="Wins / Momentum"
          actionText="Add Win"
          onAction={() => openCreateEditor('win')}
          actionLabel="Add weekly win"
        >
          {winItems.length ? (
            <ul className="weekly-list">
              {winItems.map((item) => (
                <li key={item.id} className="weekly-list__item">
                  <span className="weekly-list__dot weekly-list__dot--success" aria-hidden="true" />
                  <div className="weekly-list__content">
                    <div className="weekly-list__details">
                      <p className="weekly-note">{item.text}</p>
                      <p className="helper-text helper-text--offset">Category: {item.category}</p>
                    </div>
                    <div className="weekly-list__actions">
                      <Button
                        type="button"
                        size="small"
                        variant="ghost"
                        onClick={() => openEditEditor('win', item)}
                        ariaLabel={`Edit win ${item.text}`}
                      >
                        Edit
                      </Button>
                      <Button
                        type="button"
                        size="small"
                        variant="ghost"
                        onClick={() => handleDelete('win', item)}
                        ariaLabel={`Delete win ${item.text}`}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="helper-text">No wins captured yet. Add one to preserve momentum context.</p>
          )}
        </SectionCard>

        <SectionCard
          title="Top Blockers"
          actionText="Add Blocker"
          onAction={() => openCreateEditor('blocker')}
          actionLabel="Add weekly blocker"
        >
          {blockerItems.length ? (
            <ul className="weekly-list">
              {blockerItems.map((item) => (
                <li key={item.id} className="weekly-list__item">
                  <span className={`weekly-list__dot weekly-list__dot--${item.severity}`} aria-hidden="true" />
                  <div className="weekly-list__content">
                    <p className="weekly-note weekly-list__details">{item.text}</p>
                    <div className="weekly-list__actions">
                      <Button
                        type="button"
                        size="small"
                        variant="ghost"
                        onClick={() => openEditEditor('blocker', item)}
                        ariaLabel={`Edit blocker ${item.text}`}
                      >
                        Edit
                      </Button>
                      <Button
                        type="button"
                        size="small"
                        variant="ghost"
                        onClick={() => handleDelete('blocker', item)}
                        ariaLabel={`Delete blocker ${item.text}`}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="helper-text">No blockers logged. Add blockers to keep risk visible.</p>
          )}
        </SectionCard>

        <SectionCard title="Next Review Notes">
          <p className="weekly-note">
            Capture outcomes at close of week in plain language: what moved, what stalled, and what your next
            executive move is for the coming seven days.
          </p>
        </SectionCard>
      </div>

      <Modal isOpen={isEditorOpen} title={editorTitle} onClose={closeEditor}>
        <form className="weekly-form" onSubmit={handleEditorSubmit}>
          {editorState.type === 'priority' ? (
            <>
              <Input
                id="weekly-priority-title"
                label="Priority"
                className="settings-field"
                value={formValues.title || ''}
                onChange={(event) => handleFormChange('title', event.target.value)}
                required
              />

              <Input
                id="weekly-priority-owner"
                label="Owner"
                className="settings-field"
                value={formValues.owner || ''}
                onChange={(event) => handleFormChange('owner', event.target.value)}
                required
              />

              <label className="settings-field" htmlFor="weekly-priority-status">
                <span className="settings-field__label">Status</span>
                <select
                  id="weekly-priority-status"
                  className="settings-input"
                  value={formValues.status || 'Planned'}
                  onChange={(event) => handleFormChange('status', event.target.value)}
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

          {editorState.type === 'win' ? (
            <>
              <Textarea
                id="weekly-win-text"
                label="Win"
                className="settings-field weekly-form__textarea-field"
                value={formValues.text || ''}
                onChange={(event) => handleFormChange('text', event.target.value)}
                rows={3}
                required
              />

              <label className="settings-field" htmlFor="weekly-win-category">
                <span className="settings-field__label">Category</span>
                <select
                  id="weekly-win-category"
                  className="settings-input"
                  value={formValues.category || 'Execution'}
                  onChange={(event) => handleFormChange('category', event.target.value)}
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

          {editorState.type === 'blocker' ? (
            <>
              <Textarea
                id="weekly-blocker-text"
                label="Blocker"
                className="settings-field weekly-form__textarea-field"
                value={formValues.text || ''}
                onChange={(event) => handleFormChange('text', event.target.value)}
                rows={3}
                required
              />

              <label className="settings-field" htmlFor="weekly-blocker-severity">
                <span className="settings-field__label">Severity</span>
                <select
                  id="weekly-blocker-severity"
                  className="settings-input"
                  value={formValues.severity || 'warning'}
                  onChange={(event) => handleFormChange('severity', event.target.value)}
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
            <Button type="button" variant="ghost" onClick={closeEditor}>
              Cancel
            </Button>
            <Button type="submit" icon={{ name: 'action', size: 14 }}>
              {isEditing ? 'Save Changes' : 'Create'}
            </Button>
          </div>
        </form>
      </Modal>
    </section>
  );
}

export default WeeklyBrief;


