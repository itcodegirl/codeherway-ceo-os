import { useMemo } from 'react';
import CrudPageTemplate from '../crud/CrudPageTemplate';
import ContentTable from './ContentTable';
import ContentItemModal from './ContentItemModal';
import ContentFormModal from './ContentFormModal';
import ContentDeleteConfirmModal from './ContentDeleteConfirmModal';
import Button from '../ui/Button';
import SummaryCards from '../ui/SummaryCards';
import { CrudCardGridLoadingSkeleton } from '../crud/CrudLoadingSkeletons';
import {
  CONTENT_ITEMS_UPDATED_EVENT,
  createContentItem,
  deleteContentItem,
  getContentSource,
  listContentItems,
  updateContentItem,
} from '../../lib/contentRepository';
import { SOURCE_NOTICE_SAMPLE_DATA, SOURCE_NOTICE_SUPABASE } from '../../lib/uiCopy';
import { useCrudPage } from '../../hooks/useCrudPage';
import '../../styles/forms.css';
import '../../styles/crm-table.css';
import '../../styles/content.css';

const DEFAULT_FORM = {
  title: '',
  platform: '',
  status: 'Drafting',
};

function mapContentItemToFormValues(item) {
  return {
    title: item.title || '',
    platform: item.platform || '',
    status: item.status || 'Drafting',
  };
}

function mapContentFormValuesToPayload(formValues) {
  return {
    title: formValues.title.trim(),
    platform: formValues.platform.trim(),
    status: formValues.status,
  };
}

function validateContentPayload(payload) {
  if (!payload.title || !payload.platform) {
    return 'Title and platform are required.';
  }

  return '';
}

function ContentCrudPage() {
  const {
    isLoading,
    items: contentRows,
    selectedItem,
    setSelectedItem,
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
    listItems: listContentItems,
    createItem: createContentItem,
    updateItem: updateContentItem,
    deleteItem: deleteContentItem,
    updatedEventName: CONTENT_ITEMS_UPDATED_EVENT,
    mapItemToFormValues: mapContentItemToFormValues,
    mapFormValuesToPayload: mapContentFormValuesToPayload,
    validatePayload: validateContentPayload,
    getDeleteLabel: (item) => item.title,
    messages: {
      load: 'Unable to load content items right now.',
      save: 'Unable to save content item right now. Refresh and try again if this record changed elsewhere.',
      delete: 'Unable to delete content item right now. Refresh and try again if this record changed elsewhere.',
    },
    logPrefix: 'content items',
  });

  const source = getContentSource();

  const statusCounts = useMemo(
    () =>
      contentRows.reduce(
        (counts, item) => {
          if (counts[item.status] !== undefined) {
            counts[item.status] += 1;
          }
          return counts;
        },
        { Drafting: 0, Editing: 0, Scheduled: 0 },
      ),
    [contentRows],
  );

  const summaryCards = useMemo(
    () => ([
      {
        id: 'content-drafting',
        label: 'Drafting',
        value: statusCounts.Drafting,
      },
      {
        id: 'content-editing',
        label: 'Editing',
        value: statusCounts.Editing,
      },
      {
        id: 'content-scheduled',
        label: 'Scheduled',
        value: statusCounts.Scheduled,
      },
    ]),
    [statusCounts.Drafting, statusCounts.Editing, statusCounts.Scheduled],
  );

  return (
    <CrudPageTemplate
      pageClassName="content-page"
      header={{
        title: 'Content OS',
        description: 'Plan, track, and ship founder content across platforms with a clear publishing workflow.',
      }}
      status={{
        sourceNote: source === 'supabase'
          ? SOURCE_NOTICE_SUPABASE
          : SOURCE_NOTICE_SAMPLE_DATA,
        sourceNoteClassName: 'content-source-note',
        loadError,
        loadErrorClassName: 'content-error',
        loadingAnnouncement: 'Loading content board data.',
        isLoading,
      }}
      slots={{
        summary: {
          loadingContent: (
            <SummaryCards
              className="content-summary"
              isLoading
              loadingCount={3}
              loadingKeyPrefix="content-summary"
            />
          ),
          content: (
            <SummaryCards
              className="content-summary"
              cards={summaryCards}
            />
          ),
        },
        section: {
          title: 'Publishing Workflow',
          iconName: 'content',
          actionText: 'Add Content',
          onAction: handleOpenCreateModal,
          actionLabel: 'Create a new content item',
          loadingContent: (
            <CrudCardGridLoadingSkeleton
              className="content-board"
              ariaLabel="Publishing workflow cards"
              loadingMessage="Loading content cards."
              cards={3}
            />
          ),
          isEmpty: contentRows.length === 0,
          emptyState: {
            title: 'No content items yet',
            description: 'Add your first draft to begin tracking your publishing pipeline.',
            action: (
              <Button onClick={handleOpenCreateModal} icon={{ name: 'add', size: 14 }}>
                Add Content
              </Button>
            ),
          },
          content: <ContentTable items={contentRows} onOpenItem={setSelectedItem} />,
        },
        modals: {
          item: (
            <ContentItemModal
              selectedItem={selectedItem}
              isDeleting={isDeleting}
              onClose={() => setSelectedItem(null)}
              onEdit={handleOpenEditModal}
              onDelete={handleOpenDeleteConfirm}
            />
          ),
          form: (
            <ContentFormModal
              isOpen={isFormOpen}
              selectedItem={selectedItem}
              isSaving={isSaving}
              formValues={formValues}
              formError={formError}
              onClose={handleCloseFormModal}
              onChange={handleFormChange}
              onSubmit={handleFormSubmit}
            />
          ),
          deleteConfirm: (
            <ContentDeleteConfirmModal
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

export default ContentCrudPage;
