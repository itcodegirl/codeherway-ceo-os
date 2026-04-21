import { useMemo } from 'react';
import CrudPageTemplate from '../crud/CrudPageTemplate';
import OpportunityTable from './OpportunityTable';
import Modal from '../ui/Modal';
import DeleteConfirmModal from '../ui/DeleteConfirmModal';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Select from '../ui/Select';
import SummaryCards from '../ui/SummaryCards';
import Textarea from '../ui/Textarea';
import {
  createOpportunity,
  deleteOpportunity,
  getOpportunitiesSource,
  listOpportunities,
  updateOpportunity,
} from '../../lib/opportunitiesRepository';
import { opportunityStageTone } from '../../lib/statusMaps';
import { useCrudPage } from '../../hooks/useCrudPage';
import '../../styles/forms.css';
import '../../styles/opportunities.css';

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

function OpportunityCrudPage() {
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
  } = useCrudPage({
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
  const inProgressCount = metrics.byStage['In Progress'];

  const summaryCards = useMemo(
    () => ([
      {
        id: 'opportunities-total',
        label: 'Total Opportunities',
        value: metrics.total,
      },
      {
        id: 'opportunities-high',
        label: 'High Priority',
        value: metrics.byPriority.High,
      },
      {
        id: 'opportunities-progress',
        label: 'In Progress',
        value: inProgressCount,
      },
    ]),
    [inProgressCount, metrics.total, metrics.byPriority.High],
  );

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
        <SummaryCards
          className="opportunities-summary"
          isLoading
          loadingCount={3}
          loadingKeyPrefix="opportunities-summary"
        />
      )}
      summaryContent={(
        <SummaryCards
          className="opportunities-summary"
          cards={summaryCards}
        />
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
                Stage: <Badge label={selectedOpportunity.stage} tone={opportunityStageTone[selectedOpportunity.stage] || 'low'} />
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

            <Select
              id="opportunity-priority"
              label="Priority"
              className="form-field"
              value={formValues.priority}
              onChange={(event) => handleFormChange('priority', event.target.value)}
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
              value={formValues.stage}
              onChange={(event) => handleFormChange('stage', event.target.value)}
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

export default OpportunityCrudPage;
