import PageHeader from '../ui/PageHeader';
import SectionCard from '../ui/SectionCard';
import EmptyState from '../ui/EmptyState';

function CrudPageTemplate({
  pageClassName,
  header = {},
  status = {},
  slots = {},
  summary = {},
  section = {},
  modals = {},
}) {
  const {
    title: pageTitle,
    description: pageDescription,
  } = header;

  const {
    sourceNote,
    sourceNoteClassName,
    loadError,
    loadErrorClassName,
    loadingAnnouncement,
    isLoading = false,
  } = status;

  const summarySlot = slots.summary || summary;
  const sectionSlot = slots.section || section;
  const modalsSlot = slots.modals || modals;

  const {
    loadingContent: summaryLoadingContent,
    content: summaryContent,
  } = summarySlot;

  const {
    title: sectionTitle,
    iconName: sectionIconName,
    actionText: sectionActionText,
    onAction: onSectionAction,
    actionLabel: sectionActionLabel,
    loadingContent: sectionLoadingContent,
    isEmpty = false,
    emptyState = {},
    content: sectionContent,
  } = sectionSlot;

  const {
    title: emptyStateTitle,
    description: emptyStateDescription,
    action: emptyStateAction,
  } = emptyState;

  const {
    item: itemModal,
    form: formModal,
    deleteConfirm: deleteConfirmModal,
  } = modalsSlot;

  return (
    <section className={pageClassName}>
      <PageHeader title={pageTitle} description={pageDescription} />

      {sourceNote ? (
        <p className={`helper-text ${sourceNoteClassName || ''}`.trim()}>
          {sourceNote}
        </p>
      ) : null}

      {loadError ? (
        <p className={`helper-text ${loadErrorClassName || ''}`.trim()} role="alert">
          {loadError}
        </p>
      ) : null}

      {isLoading && loadingAnnouncement ? <p className="sr-only" role="status" aria-live="polite">{loadingAnnouncement}</p> : null}

      {isLoading ? summaryLoadingContent : summaryContent}

      <SectionCard
        title={sectionTitle}
        iconName={sectionIconName}
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
