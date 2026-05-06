import { useMemo, useState } from 'react';
import CrudPageTemplate from '../crud/CrudPageTemplate';
import OpportunityTable from './OpportunityTable';
import OpportunityItemModal from './OpportunityItemModal';
import OpportunityFormModal from './OpportunityFormModal';
import OpportunityDeleteConfirmModal from './OpportunityDeleteConfirmModal';
import Button from '../ui/Button';
import SummaryCards from '../ui/SummaryCards';
import { CrudTableLoadingSkeleton } from '../crud/CrudLoadingSkeletons';
import {
  OPPORTUNITIES_UPDATED_EVENT,
  createOpportunity,
  deleteOpportunity,
  getOpportunitiesSource,
  listOpportunities,
  updateOpportunity,
} from '../../lib/opportunitiesRepository';
import { SOURCE_NOTICE_SAMPLE_DATA, SOURCE_NOTICE_SUPABASE } from '../../lib/uiCopy';
import { validateOpportunityPayload } from '../../lib/opportunityPayloadSchema';
import { useCrudPage } from '../../hooks/useCrudPage';
import '../../styles/forms.css';
import '../../styles/crm-table.css';
import '../../styles/opportunities.css';

const DEFAULT_FORM = {
  name: '',
  company: '',
  priority: 'Medium',
  stage: 'New',
  nextStep: '',
};

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
    updatedEventName: OPPORTUNITIES_UPDATED_EVENT,
    mapItemToFormValues: mapOpportunityToFormValues,
    mapFormValuesToPayload: mapOpportunityFormValuesToPayload,
    validatePayload: validateOpportunityPayload,
    getDeleteLabel: (item) => item.name,
    messages: {
      load: 'Unable to load opportunities right now.',
      save: 'Unable to save opportunity right now. Refresh and try again if this record changed elsewhere.',
      delete: 'Unable to delete opportunity right now. Refresh and try again if this record changed elsewhere.',
    },
    logPrefix: 'opportunities',
  });

  // Source is a runtime config check that doesn't change during a session.
  // Reading it from a useState initializer avoids hitting the resolver on
  // every render (modal open, form keystroke, list refresh, etc.).
  const [source] = useState(() => getOpportunitiesSource());

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
      header={{
        title: 'Opportunities',
        description: 'Track partnerships, roles, and outreach as an executive-grade pipeline.',
      }}
      status={{
        sourceNote: source === 'supabase'
          ? SOURCE_NOTICE_SUPABASE
          : SOURCE_NOTICE_SAMPLE_DATA,
        sourceNoteClassName: 'opportunities-source-note',
        loadError,
        loadErrorClassName: 'opportunities-error',
        loadingAnnouncement: 'Loading opportunities data.',
        isLoading,
      }}
      slots={{
        summary: {
          loadingContent: (
            <SummaryCards
              className="opportunities-summary"
              isLoading
              loadingCount={3}
              loadingKeyPrefix="opportunities-summary"
            />
          ),
          content: (
            <SummaryCards
              className="opportunities-summary"
              cards={summaryCards}
            />
          ),
        },
        section: {
          title: 'Pipeline Overview',
          iconName: 'opportunities',
          actionText: 'Add Opportunity',
          onAction: handleOpenCreateModal,
          actionLabel: 'Create a new opportunity',
          loadingContent: (
            <CrudTableLoadingSkeleton
              ariaLabel="Opportunity pipeline"
              loadingMessage="Loading pipeline rows."
              rows={3}
              columns={[
                { key: 'opportunity', label: 'Opportunity', dataLabel: 'Opportunity' },
                { key: 'company', label: 'Company', dataLabel: 'Company' },
                { key: 'priority', label: 'Priority', dataLabel: 'Priority' },
                { key: 'stage', label: 'Stage / Next Step', dataLabel: 'Stage / Next Step' },
              ]}
            />
          ),
          isEmpty: opportunityItems.length === 0,
          emptyState: {
            title: 'No opportunities yet',
            description: 'Add your first opportunity to start tracking outreach and next steps.',
            action: (
              <Button onClick={handleOpenCreateModal} icon={{ name: 'add', size: 14 }}>
                Add Opportunity
              </Button>
            ),
          },
          content: (
            <div>
              <p className="sr-only" role="status" aria-live="polite">
                Showing {opportunityItems.length} opportunities.
              </p>
              <OpportunityTable items={opportunityItems} onSelect={setSelectedOpportunity} />
            </div>
          ),
        },
        modals: {
          item: (
            <OpportunityItemModal
              selectedOpportunity={selectedOpportunity}
              isDeleting={isDeleting}
              onClose={() => setSelectedOpportunity(null)}
              onEdit={handleOpenEditModal}
              onDelete={handleOpenDeleteConfirm}
            />
          ),
          form: (
            <OpportunityFormModal
              isOpen={isFormOpen}
              selectedOpportunity={selectedOpportunity}
              isSaving={isSaving}
              formValues={formValues}
              formError={formError}
              onClose={handleCloseFormModal}
              onChange={handleFormChange}
              onSubmit={handleFormSubmit}
            />
          ),
          deleteConfirm: (
            <OpportunityDeleteConfirmModal
              isOpen={isDeleteConfirmOpen}
              message={deletePrompt}
              onCancel={handleCloseDeleteConfirm}
              onConfirm={handleConfirmDeleteSelected}
              isDeleting={isDeleting}
            />
          ),
        },
      }}
    />
  );
}

export default OpportunityCrudPage;
