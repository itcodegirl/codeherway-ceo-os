import PageHeader from '../ui/PageHeader';
import SectionCard from '../ui/SectionCard';
import EmptyState from '../ui/EmptyState';

function CrudPageTemplate({
  page = {},
  source = {},
  status = {},
  summary = {},
  section = {},
  modals = {},
}) {
  const {
    className: pageClassName,
    title: pageTitle,
    description: pageDescription,
  } = page;
  const {
    note: sourceNote,
    noteClassName: sourceNoteClassName = '',
  } = source;
  const {
    loadError,
    loadErrorClassName = '',
    loadingAnnouncement,
    isLoading = false,
  } = status;
  const {
    loadingContent: summaryLoadingContent,
    content: summaryContent,
  } = summary;
  const {
    title: sectionTitle,
    iconName: sectionIconName,
    actionText: sectionActionText,
    actionIconName: sectionActionIconName,
    onAction: onSectionAction,
    actionLabel: sectionActionLabel,
    loadingContent: sectionLoadingContent,
    isEmpty,
    emptyState = {},
    content: sectionContent,
  } = section;
  const {
    title: emptyStateTitle,
    description: emptyStateDescription,
    action: emptyStateAction,
  } = emptyState;
  const {
    item: itemModal,
    form: formModal,
    deleteConfirm: deleteConfirmModal,
  } = modals;

  return (
    <section className={pageClassName}>
      <PageHeader title={pageTitle} description={pageDescription} />

      <p className={`helper-text ${sourceNoteClassName}`.trim()}>
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
        iconName={sectionIconName}
        actionText={sectionActionText}
        actionIconName={sectionActionIconName}
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
