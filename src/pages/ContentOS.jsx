import { useMemo } from 'react';
import SectionCard from '../components/ui/SectionCard';
import EmptyState from '../components/ui/EmptyState';
import PageHeader from '../components/ui/PageHeader';
import ContentTable from '../components/content/ContentTable';
import Modal from '../components/ui/Modal';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import {
  createContentItem,
  deleteContentItem,
  getContentSource,
  listContentItems,
  updateContentItem,
} from '../lib/contentRepository';
import { useCrudCollection } from '../hooks/useCrudCollection';
import '../styles/content.css';

const statusTone = {
  Drafting: 'low',
  Editing: 'warning',
  Scheduled: 'high',
};

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

function ContentOS() {
  const {
    isLoading,
    items: contentRows,
    selectedItem,
    setSelectedItem,
    isFormOpen,
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
    handleDeleteSelected,
  } = useCrudCollection({
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

  return (
    <section className="content-page">
      <PageHeader
        title="Content OS"
        description="Plan, track, and ship founder content across platforms with a clear publishing workflow."
      />

      <p className="helper-text content-source-note" role="status" aria-live="polite">
        {source === 'supabase'
          ? 'Data source: Supabase (live persistence).'
          : 'Data source: local demo storage. Configure Supabase env vars to persist to backend.'}
      </p>

      {loadError ? (
        <p className="helper-text content-error" role="alert">
          {loadError}
        </p>
      ) : null}

      {isLoading ? <p className="sr-only" role="status" aria-live="polite">Loading content board data.</p> : null}

      {isLoading ? (
        <div className="content-summary" aria-busy={isLoading}>
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
        <div className="content-summary">
          <article className="summary-card">
            <p className="summary-card__label">Drafting</p>
            <h3 className="summary-card__value">{statusCounts.Drafting}</h3>
          </article>

          <article className="summary-card">
            <p className="summary-card__label">Editing</p>
            <h3 className="summary-card__value">{statusCounts.Editing}</h3>
          </article>

          <article className="summary-card">
            <p className="summary-card__label">Scheduled</p>
            <h3 className="summary-card__value">{statusCounts.Scheduled}</h3>
          </article>
        </div>
      )}

      <SectionCard
        title="Publishing Workflow"
        actionText="Add Content"
        onAction={handleOpenCreateModal}
        actionLabel="Create a new content item"
      >
        {isLoading ? (
          <div className="content-board" role="list" aria-label="Publishing workflow cards" aria-busy={isLoading}>
            <p className="sr-only" role="status" aria-live="polite">
              Loading content cards.
            </p>
            {Array.from({ length: 3 }).map((_, index) => (
              <article className="content-card" key={index} role="listitem">
                <div className="content-card__header">
                  <div>
                    <div className="skeleton-line skeleton-line--value" />
                    <div className="skeleton-line skeleton-line--offset" />
                  </div>
                  <div className="skeleton-line skeleton-line--meta-wide" />
                </div>
                <div className="content-card__footer">
                  <div className="skeleton-line skeleton-line--meta-narrow" />
                  <div className="skeleton-line skeleton-line--meta-narrow" />
                </div>
              </article>
            ))}
          </div>
        ) : contentRows.length === 0 ? (
          <EmptyState
            title="No content items yet"
            description="Add your first draft to begin tracking your publishing pipeline."
            action={
              <Button onClick={handleOpenCreateModal} icon={{ name: 'action', size: 14 }}>
                Add Content
              </Button>
            }
          />
        ) : (
          <ContentTable items={contentRows} onOpenItem={setSelectedItem} />
        )}
      </SectionCard>

      <Modal isOpen={Boolean(selectedItem)} title={selectedItem ? selectedItem.title : ''} onClose={() => setSelectedItem(null)}>
        {selectedItem ? (
          <div className="content-modal-content">
            <p className="helper-text">Platform: {selectedItem.platform}</p>
            <p className="helper-text">
              Status: <Badge label={selectedItem.status} tone={statusTone[selectedItem.status] || 'default'} />
            </p>
            <div className="content-modal-actions">
              <Button
                type="button"
                onClick={handleOpenEditModal}
                aria-label="Edit selected content item"
                icon={{ name: 'action', size: 14 }}
              >
                Edit
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={handleDeleteSelected}
                disabled={isDeleting}
                aria-label="Delete selected content item"
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
        title={selectedItem ? 'Edit Content Item' : 'Add Content Item'}
        onClose={handleCloseFormModal}
      >
        <form className="content-form" onSubmit={handleFormSubmit}>
          <Input
            id="content-title"
            label="Title"
            className="settings-field"
            value={formValues.title}
            onChange={(event) => handleFormChange('title', event.target.value)}
            required
            disabled={isSaving}
          />

          <Input
            id="content-platform"
            label="Platform"
            className="settings-field"
            value={formValues.platform}
            onChange={(event) => handleFormChange('platform', event.target.value)}
            required
            disabled={isSaving}
          />

          <label className="settings-field" htmlFor="content-status">
            <span className="settings-field__label">Status</span>
            <select
              id="content-status"
              className="settings-input"
              value={formValues.status}
              onChange={(event) => handleFormChange('status', event.target.value)}
              disabled={isSaving}
            >
              {STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </label>

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
              icon={{ name: 'action', size: 14 }}
            >
              {isSaving ? 'Saving...' : selectedItem ? 'Save Changes' : 'Create Content'}
            </Button>
          </div>
        </form>
      </Modal>
    </section>
  );
}

export default ContentOS;
