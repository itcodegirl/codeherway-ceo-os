import { useMemo } from 'react';
import CrudPageTemplate from '../crud/CrudPageTemplate';
import ContentTable from './ContentTable';
import Modal from '../ui/Modal';
import DeleteConfirmModal from '../ui/DeleteConfirmModal';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Select from '../ui/Select';
import SummaryCards from '../ui/SummaryCards';
import { CrudCardGridLoadingSkeleton } from '../crud/CrudLoadingSkeletons';
import {
  createContentItem,
  deleteContentItem,
  getContentSource,
  listContentItems,
  updateContentItem,
} from '../../lib/contentRepository';
import { contentStatusTone } from '../../lib/statusMaps';
import { useCrudPage } from '../../hooks/useCrudPage';
import '../../styles/forms.css';
import '../../styles/content.css';

const STATUS_OPTIONS = ['Drafting', 'Editing', 'Scheduled'];

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
    mapItemToFormValues: mapContentItemToFormValues,
    mapFormValuesToPayload: mapContentFormValuesToPayload,
    validatePayload: validateContentPayload,
    getDeleteLabel: (item) => item.title,
    messages: {
      load: 'Unable to load content items right now.',
      save: 'Unable to save content item right now.',
      delete: 'Unable to delete content item right now.',
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
          ? 'Data source: Supabase (live persistence).'
          : 'Sample data - configure Supabase to use real data.',
        sourceNoteClassName: 'content-source-note',
        loadError,
        loadErrorClassName: 'content-error',
        loadingAnnouncement: 'Loading content board data.',
        isLoading,
      }}
      summary={{
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
      }}
      section={{
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
      }}
      modals={{
        item: (
          <Modal
            isOpen={Boolean(selectedItem)}
            title={selectedItem ? selectedItem.title : ''}
            onClose={() => setSelectedItem(null)}
          >
            {selectedItem ? (
              <div className="content-modal-content">
                <p className="helper-text">Platform: {selectedItem.platform}</p>
                <p className="helper-text">
                  Status: <Badge label={selectedItem.status} tone={contentStatusTone[selectedItem.status] || 'default'} />
                </p>
                <div className="content-modal-actions">
                  <Button
                    type="button"
                    onClick={handleOpenEditModal}
                    aria-label="Edit selected content item"
                    icon={{ name: 'edit', size: 14 }}
                  >
                    Edit
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={handleOpenDeleteConfirm}
                    disabled={isDeleting}
                    aria-label="Delete selected content item"
                    icon={{ name: 'delete', size: 14 }}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ) : null}
          </Modal>
        ),
        form: (
          <Modal
            isOpen={isFormOpen}
            title={selectedItem ? 'Edit Content Item' : 'Add Content Item'}
            onClose={handleCloseFormModal}
          >
            <form className="content-form" onSubmit={handleFormSubmit}>
              <Input
                id="content-title"
                label="Title"
                className="form-field"
                value={formValues.title}
                onChange={(event) => handleFormChange('title', event.target.value)}
                required
                disabled={isSaving}
              />

              <Input
                id="content-platform"
                label="Platform"
                className="form-field"
                value={formValues.platform}
                onChange={(event) => handleFormChange('platform', event.target.value)}
                required
                disabled={isSaving}
              />

              <Select
                id="content-status"
                label="Status"
                className="form-field"
                value={formValues.status}
                onChange={(event) => handleFormChange('status', event.target.value)}
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
                  onClick={handleCloseFormModal}
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
        ),
        deleteConfirm: (
          <DeleteConfirmModal
            isOpen={isDeleteConfirmOpen}
            title="Delete Content Item"
            message={deletePrompt}
            onCancel={handleCloseDeleteConfirm}
            onConfirm={handleConfirmDeleteSelected}
            isDeleting={isDeleting}
          />
        ),
      }}
    />
  );
}

export default ContentCrudPage;
