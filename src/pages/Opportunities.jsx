import { useEffect, useMemo, useState } from 'react';
import SectionCard from '../components/ui/SectionCard';
import EmptyState from '../components/ui/EmptyState';
import PageHeader from '../components/ui/PageHeader';
import OpportunityTable from '../components/opportunities/OpportunityTable';
import Modal from '../components/ui/Modal';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import {
  createOpportunity,
  deleteOpportunity,
  getOpportunitiesSource,
  listOpportunities,
  updateOpportunity,
} from '../lib/opportunitiesRepository';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import '../styles/opportunities.css';

const stageTone = {
  'In Progress': 'high',
  'Awaiting Reply': 'warning',
  New: 'low',
};

const DEFAULT_FORM = {
  name: '',
  company: '',
  priority: 'Medium',
  stage: 'New',
  nextStep: '',
};

const PRIORITY_OPTIONS = ['High', 'Medium', 'Low'];
const STAGE_OPTIONS = ['In Progress', 'Awaiting Reply', 'New'];

function Opportunities() {
  useDocumentTitle(
    'Opportunities',
    'Track partnerships, roles, and outreach as an executive-grade pipeline.',
  );

  const [isLoading, setIsLoading] = useState(true);
  const [opportunityItems, setOpportunityItems] = useState([]);
  const [selectedOpportunity, setSelectedOpportunity] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [formValues, setFormValues] = useState(DEFAULT_FORM);
  const [formError, setFormError] = useState('');
  const [loadError, setLoadError] = useState('');
  const source = getOpportunitiesSource();

  const metrics = useMemo(() => {
    return opportunityItems.reduce(
      (acc, opportunity) => {
        acc.total += 1;
        if (acc.byPriority[opportunity.priority] !== undefined) {
          acc.byPriority[opportunity.priority] += 1;
        }
        if (acc.byStage[opportunity.stage] !== undefined) {
          acc.byStage[opportunity.stage] += 1;
        }
        return acc;
      },
      {
        total: 0,
        byPriority: { High: 0, Medium: 0, Low: 0 },
        byStage: { 'In Progress': 0, 'Awaiting Reply': 0, New: 0 },
      },
    );
  }, [opportunityItems]);

  useEffect(() => {
    let isActive = true;

    const load = async () => {
      setIsLoading(true);
      setLoadError('');
      try {
        const items = await listOpportunities();
        if (isActive) {
          setOpportunityItems(items);
        }
      } catch (error) {
        if (!isActive) {
          return;
        }
        setLoadError('Unable to load opportunities right now.');
        if (import.meta.env.DEV) {
          console.error('Failed to load opportunities', error);
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    load();

    return () => {
      isActive = false;
    };
  }, []);

  const resetForm = () => {
    setFormValues(DEFAULT_FORM);
    setFormError('');
  };

  const handleOpenCreateModal = () => {
    setSelectedOpportunity(null);
    resetForm();
    setIsFormOpen(true);
  };

  const handleOpenEditModal = () => {
    if (!selectedOpportunity) {
      return;
    }

    setFormValues({
      name: selectedOpportunity.name || '',
      company: selectedOpportunity.company || '',
      priority: selectedOpportunity.priority || 'Medium',
      stage: selectedOpportunity.stage || 'New',
      nextStep: selectedOpportunity.nextStep || '',
    });
    setFormError('');
    setIsFormOpen(true);
  };

  const handleCloseFormModal = () => {
    if (isSaving) {
      return;
    }

    setIsFormOpen(false);
    setFormError('');
  };

  const handleFormChange = (field, value) => {
    setFormValues((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleFormSubmit = async (event) => {
    event.preventDefault();
    const payload = {
      name: formValues.name.trim(),
      company: formValues.company.trim(),
      priority: formValues.priority,
      stage: formValues.stage,
      nextStep: formValues.nextStep.trim(),
    };

    if (!payload.name || !payload.company || !payload.nextStep) {
      setFormError('Name, company, and next step are required.');
      return;
    }

    setIsSaving(true);
    setFormError('');

    try {
      if (selectedOpportunity) {
        const updated = await updateOpportunity(selectedOpportunity.id, payload);
        setOpportunityItems((current) =>
          current.map((item) => (item.id === updated.id ? updated : item)),
        );
        setSelectedOpportunity(updated);
      } else {
        const created = await createOpportunity(payload);
        setOpportunityItems((current) => [created, ...current]);
      }

      setIsFormOpen(false);
      resetForm();
    } catch (error) {
      setFormError('Unable to save opportunity right now.');
      if (import.meta.env.DEV) {
        console.error('Failed to save opportunity', error);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteSelected = async () => {
    if (!selectedOpportunity) {
      return;
    }

    const shouldDelete = window.confirm(`Delete "${selectedOpportunity.name}"? This cannot be undone.`);
    if (!shouldDelete) {
      return;
    }

    setIsDeleting(true);
    try {
      await deleteOpportunity(selectedOpportunity.id);
      setOpportunityItems((current) => current.filter((item) => item.id !== selectedOpportunity.id));
      setSelectedOpportunity(null);
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Failed to delete opportunity', error);
      }
      setLoadError('Unable to delete opportunity right now.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <section className="opportunities-page">
      <PageHeader
        title="Opportunities"
        description="Track partnerships, roles, and outreach as an executive-grade pipeline."
      />

      <p className="helper-text opportunities-source-note" role="status" aria-live="polite">
        {source === 'supabase'
          ? 'Data source: Supabase (live persistence).'
          : 'Data source: local demo storage. Configure Supabase env vars to persist to backend.'}
      </p>

      {loadError ? (
        <p className="helper-text opportunities-error" role="alert">
          {loadError}
        </p>
      ) : null}

      {isLoading ? <p className="sr-only" role="status" aria-live="polite">Loading opportunities data.</p> : null}

      {isLoading ? (
        <div className="opportunities-summary" aria-busy={isLoading}>
          <article className="summary-card">
            <div className="skeleton-line skeleton-line--label" />
            <div className="skeleton-line skeleton-line--value" />
          </article>
          <article className="summary-card">
            <div className="skeleton-line skeleton-line--label" />
            <div className="skeleton-line skeleton-line--value" />
          </article>
          <article className="summary-card">
            <div className="skeleton-line skeleton-line--label" />
            <div className="skeleton-line skeleton-line--value" />
          </article>
        </div>
      ) : (
        <div className="opportunities-summary">
          <article className="summary-card">
            <p className="summary-card__label">Total Opportunities</p>
            <h3 className="summary-card__value">{metrics.total}</h3>
          </article>

          <article className="summary-card">
            <p className="summary-card__label">High Priority</p>
            <h3 className="summary-card__value">{metrics.byPriority.High}</h3>
          </article>

          <article className="summary-card">
            <p className="summary-card__label">In Progress</p>
            <h3 className="summary-card__value">{metrics.byStage['In Progress']}</h3>
          </article>
        </div>
      )}

      <SectionCard
        title="Pipeline Overview"
        actionText="Add Opportunity"
        onAction={handleOpenCreateModal}
        actionLabel="Create a new opportunity"
      >
        {isLoading ? (
          <div className="crm-table" role="table" aria-label="Opportunity pipeline" aria-busy={isLoading}>
            <p className="sr-only" role="status" aria-live="polite">
              Loading pipeline rows.
            </p>
            <div className="crm-table__header" role="row">
              <p role="columnheader">Opportunity</p>
              <p role="columnheader">Company</p>
              <p role="columnheader">Priority</p>
              <p role="columnheader">Stage / Next Step</p>
            </div>
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="crm-table__row" role="row">
                <div className="crm-table__cell" role="cell" data-label="Opportunity">
                  <div className="skeleton-line" />
                </div>
                <div className="crm-table__cell" role="cell" data-label="Company">
                  <div className="skeleton-line" />
                </div>
                <div className="crm-table__cell" role="cell" data-label="Priority">
                  <div className="skeleton-line" />
                </div>
                <div className="crm-table__cell" role="cell" data-label="Stage / Next Step">
                  <div className="skeleton-line" />
                </div>
              </div>
            ))}
          </div>
        ) : opportunityItems.length === 0 ? (
          <EmptyState
            title="No opportunities yet"
            description="Add your first opportunity to start tracking outreach and next steps."
            action={
              <Button onClick={handleOpenCreateModal} icon={{ name: 'action', size: 14 }}>
                Add Opportunity
              </Button>
            }
          />
        ) : (
          <div>
            <p className="sr-only" role="status" aria-live="polite">
              Showing {opportunityItems.length} opportunities.
            </p>
            <OpportunityTable items={opportunityItems} onSelect={setSelectedOpportunity} />
          </div>
        )}
      </SectionCard>

      <Modal
        isOpen={Boolean(selectedOpportunity)}
        title={selectedOpportunity ? selectedOpportunity.name : ''}
        onClose={() => setSelectedOpportunity(null)}
      >
        {selectedOpportunity ? (
          <div className="opportunity-modal-content">
            <p className="helper-text">Company: {selectedOpportunity.company}</p>
            <p className="helper-text">
              Priority: <Badge label={selectedOpportunity.priority} tone={selectedOpportunity.priority.toLowerCase()} />
            </p>
            <p className="helper-text">
              Stage: <Badge label={selectedOpportunity.stage} tone={stageTone[selectedOpportunity.stage] || 'low'} />
            </p>
            <p className="helper-text">Next step: {selectedOpportunity.nextStep}</p>
            <div className="opportunity-modal-actions">
              <Button
                type="button"
                onClick={handleOpenEditModal}
                aria-label="Edit selected opportunity"
                icon={{ name: 'action', size: 14 }}
              >
                Edit
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={handleDeleteSelected}
                disabled={isDeleting}
                aria-label="Delete selected opportunity"
                icon={{ name: 'action', size: 14 }}
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </div>
        ) : null}
      </Modal>

      <Modal
        isOpen={isFormOpen}
        title={selectedOpportunity ? 'Edit Opportunity' : 'Add Opportunity'}
        onClose={handleCloseFormModal}
      >
        <form className="opportunity-form" onSubmit={handleFormSubmit}>
          <label className="settings-field" htmlFor="opportunity-name">
            <span className="settings-field__label">Opportunity</span>
            <input
              id="opportunity-name"
              className="settings-input"
              value={formValues.name}
              onChange={(event) => handleFormChange('name', event.target.value)}
              required
              disabled={isSaving}
            />
          </label>

          <label className="settings-field" htmlFor="opportunity-company">
            <span className="settings-field__label">Company</span>
            <input
              id="opportunity-company"
              className="settings-input"
              value={formValues.company}
              onChange={(event) => handleFormChange('company', event.target.value)}
              required
              disabled={isSaving}
            />
          </label>

          <label className="settings-field" htmlFor="opportunity-priority">
            <span className="settings-field__label">Priority</span>
            <select
              id="opportunity-priority"
              className="settings-input"
              value={formValues.priority}
              onChange={(event) => handleFormChange('priority', event.target.value)}
              disabled={isSaving}
            >
              {PRIORITY_OPTIONS.map((priority) => (
                <option key={priority} value={priority}>
                  {priority}
                </option>
              ))}
            </select>
          </label>

          <label className="settings-field" htmlFor="opportunity-stage">
            <span className="settings-field__label">Stage</span>
            <select
              id="opportunity-stage"
              className="settings-input"
              value={formValues.stage}
              onChange={(event) => handleFormChange('stage', event.target.value)}
              disabled={isSaving}
            >
              {STAGE_OPTIONS.map((stage) => (
                <option key={stage} value={stage}>
                  {stage}
                </option>
              ))}
            </select>
          </label>

          <label className="settings-field" htmlFor="opportunity-next-step">
            <span className="settings-field__label">Next Step</span>
            <textarea
              id="opportunity-next-step"
              className="settings-input opportunity-form__textarea"
              value={formValues.nextStep}
              onChange={(event) => handleFormChange('nextStep', event.target.value)}
              required
              disabled={isSaving}
              rows={3}
            />
          </label>

          {formError ? (
            <p className="helper-text opportunities-error" role="alert">
              {formError}
            </p>
          ) : null}

          <div className="opportunity-modal-actions">
            <Button
              type="button"
              variant="ghost"
              onClick={handleCloseFormModal}
              disabled={isSaving}
              aria-label="Cancel opportunity form"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSaving}
              aria-label={selectedOpportunity ? 'Save opportunity changes' : 'Create opportunity'}
              icon={{ name: 'action', size: 14 }}
            >
              {isSaving ? 'Saving...' : selectedOpportunity ? 'Save Changes' : 'Create Opportunity'}
            </Button>
          </div>
        </form>
      </Modal>
    </section>
  );
}

export default Opportunities;
