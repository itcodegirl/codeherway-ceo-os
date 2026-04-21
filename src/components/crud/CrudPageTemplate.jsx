import PageHeader from '../ui/PageHeader';
import SectionCard from '../ui/SectionCard';
import EmptyState from '../ui/EmptyState';

function CrudPageTemplate({
  pageClassName,
  pageTitle,
  pageDescription,
  sourceNote,
  sourceNoteClassName,
  loadError,
  loadErrorClassName,
  loadingAnnouncement,
  isLoading,
  summaryLoadingContent,
  summaryContent,
  sectionTitle,
  sectionActionText,
  onSectionAction,
  sectionActionLabel,
  sectionLoadingContent,
  isEmpty,
  emptyStateTitle,
  emptyStateDescription,
  emptyStateAction,
  sectionContent,
  itemModal,
  formModal,
  deleteConfirmModal,
}) {
  return (
    <section className={pageClassName}>
      <PageHeader title={pageTitle} description={pageDescription} />

      <p className={`helper-text ${sourceNoteClassName}`.trim()} role="status" aria-live="polite">
        {sourceNote}
      </p>

      {loadError ? (
        <p className={`helper-text ${loadErrorClassName}`.trim()} role="alert">
          {loadError}
        </p>
      ) : null}

      {isLoading ? <p className="sr-only" role="status" aria-live="polite">{loadingAnnouncement}</p> : null}

      {isLoading ? summaryLoadingContent : summaryContent}

      <SectionCard
        title={sectionTitle}
        actionText={sectionActionText}
        onAction={onSectionAction}
        actionLabel={sectionActionLabel}
      >
        {isLoading ? sectionLoadingContent : isEmpty ? (
          <EmptyState
            title={emptyStateTitle}
            description={emptyStateDescription}
            action={emptyStateAction}
          />
        ) : (
          sectionContent
        )}
      </SectionCard>

      {itemModal}
      {formModal}
      {deleteConfirmModal}
    </section>
  );
}

export default CrudPageTemplate;
