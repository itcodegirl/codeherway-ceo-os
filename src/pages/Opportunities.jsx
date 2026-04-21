import { useMemo } from 'react';
import CrudPageTemplate from '../components/crud/CrudPageTemplate';
import OpportunityTable from '../components/opportunities/OpportunityTable';
import Modal from '../components/ui/Modal';
import DeleteConfirmModal from '../components/ui/DeleteConfirmModal';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Textarea from '../components/ui/Textarea';
import {
  createOpportunity,
  deleteOpportunity,
  getOpportunitiesSource,
  listOpportunities,
  updateOpportunity,
} from '../lib/opportunitiesRepository';
import { useCrudCollection } from '../hooks/useCrudCollection';
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

function mapOpportunityToFormValues(item) {
  return {
    name: item.name || '',
    company: item.company || '',
    priority: item.priority || 'Medium',
    stage: item.stage || 'New',
    nextStep: item.nextStep || '',
  };
}

function mapOpportunityFormValuesToPayload(formValues) {
  return {
    name: formValues.name.trim(),
    company: formValues.company.trim(),
    priority: formValues.priority,
    stage: formValues.stage,
    nextStep: formValues.nextStep.trim(),
  };
}

function validateOpportunityPayload(payload) {
  if (!payload.name || !payload.company || !payload.nextStep) {
    return 'Name, company, and next step are required.';
  }

  return '';
}

function Opportunities() {
  const {
    isLoading,
    items: opportunityItems,
    selectedItem: selectedOpportunity,
    setSelectedItem: setSelectedOpportunity,
    isFormOpen,
    isDeleteConfirmOpen,
    isSaving,
    isDeleting,
    formValues,
    formError,
    loadError,
    handleOpenCreateModal,
    handleOpenEditModal,
    handleCloseFormModal,
    handleFormChange,
    handleFormSubmit,
    handleOpenDeleteConfirm,
    handleCloseDeleteConfirm,
    handleConfirmDeleteSelected,
    deletePrompt,
  } = useCrudCollection({
    defaultFormValues: DEFAULT_FORM,
    listItems: listOpportunities,
    createItem: createOpportunity,
    updateItem: updateOpportunity,
    deleteItem: deleteOpportunity,
    mapItemToFormValues: mapOpportunityToFormValues,
    mapFormValuesToPayload: mapOpportunityFormValuesToPayload,
    validatePayload: validateOpportunityPayload,
    getDeleteLabel: (item) => item.name,
    messages: {
      load: 'Unable to load opportunities right now.',
      save: 'Unable to save opportunity right now.',
      delete: 'Unable to delete opportunity right now.',
    },
    logPrefix: 'opportunities',
  });
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

  return (
    <CrudPageTemplate
      pageClassName="opportunities-page"
      pageTitle="Opportunities"
      pageDescription="Track partnerships, roles, and outreach as an executive-grade pipeline."
      sourceNote={source === 'supabase'
        ? 'Data source: Supabase (live persistence).'
        : 'Data source: local demo storage. Configure Supabase env vars to persist to backend.'}
      sourceNoteClassName="opportunities-source-note"
      loadError={loadError}
      loadErrorClassName="opportunities-error"
      loadingAnnouncement="Loading opportunities data."
      isLoading={isLoading}
      summaryLoadingContent={(
        <div className="opportunities-summary" aria-busy={isLoading}>
          {Array.from({ length: 3 }).map((_, index) => (
            <article className="summary-card" key={`opportunities-summary-loading-${index}`}>
              <div className="skeleton-line skeleton-line--label" />
              <div className="skeleton-line skeleton-line--value" />
            </article>
          ))}
        </div>
      )}
      summaryContent={(
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
      sectionTitle="Pipeline Overview"
      sectionActionText="Add Opportunity"
      onSectionAction={handleOpenCreateModal}
      sectionActionLabel="Create a new opportunity"
      sectionLoadingContent={(
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
      )}
      isEmpty={opportunityItems.length === 0}
      emptyStateTitle="No opportunities yet"
      emptyStateDescription="Add your first opportunity to start tracking outreach and next steps."
      emptyStateAction={(
        <Button onClick={handleOpenCreateModal} icon={{ name: 'action', size: 14 }}>
          Add Opportunity
        </Button>
      )}
      sectionContent={(
        <div>
          <p className="sr-only" role="status" aria-live="polite">
            Showing {opportunityItems.length} opportunities.
          </p>
          <OpportunityTable items={opportunityItems} onSelect={setSelectedOpportunity} />
        </div>
      )}
      itemModal={(
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
                  onClick={handleOpenDeleteConfirm}
                  disabled={isDeleting}
                  aria-label="Delete selected opportunity"
                  icon={{ name: 'action', size: 14 }}
                >
                  Delete
                </Button>
              </div>
            </div>
          ) : null}
        </Modal>
      )}
      formModal={(
        <Modal
          isOpen={isFormOpen}
          title={selectedOpportunity ? 'Edit Opportunity' : 'Add Opportunity'}
          onClose={handleCloseFormModal}
        >
          <form className="opportunity-form" onSubmit={handleFormSubmit}>
            <Input
              id="opportunity-name"
              label="Opportunity"
              className="form-field"
              value={formValues.name}
              onChange={(event) => handleFormChange('name', event.target.value)}
              required
              disabled={isSaving}
            />

            <Input
              id="opportunity-company"
              label="Company"
              className="form-field"
              value={formValues.company}
              onChange={(event) => handleFormChange('company', event.target.value)}
              required
              disabled={isSaving}
            />

            <label className="form-field" htmlFor="opportunity-priority">
              <span className="form-field__label">Priority</span>
              <select
                id="opportunity-priority"
                className="form-input"
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

            <label className="form-field" htmlFor="opportunity-stage">
              <span className="form-field__label">Stage</span>
              <select
                id="opportunity-stage"
                className="form-input"
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

            <Textarea
              id="opportunity-next-step"
              label="Next Step"
              className="form-field opportunity-form__textarea-field"
              value={formValues.nextStep}
              onChange={(event) => handleFormChange('nextStep', event.target.value)}
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
      )}
      deleteConfirmModal={(
        <DeleteConfirmModal
          isOpen={isDeleteConfirmOpen}
          title="Delete Opportunity"
          message={deletePrompt}
          onCancel={handleCloseDeleteConfirm}
          onConfirm={handleConfirmDeleteSelected}
          isDeleting={isDeleting}
        />
      )}
    />
  );
}

export default Opportunities;
