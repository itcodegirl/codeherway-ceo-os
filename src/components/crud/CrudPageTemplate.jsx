import { useEffect, useRef } from 'react';
import PageHeader from '../ui/PageHeader';
import SectionCard from '../ui/SectionCard';
import EmptyState from '../ui/EmptyState';

const LEGACY_PROPS_REMOVAL_TARGET = '2026-09-30';

function hasKeys(value) {
  return Boolean(value && typeof value === 'object' && Object.keys(value).length > 0);
}

/**
 * @deprecated Legacy `summary`, `section`, and `modals` props are scheduled for removal on 2026-09-30.
 * Migrate to `slots.summary`, `slots.section`, and `slots.modals`.
 */
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
  const hasWarnedLegacyProps = useRef(false);
  const usesLegacyProps = (
    (!hasKeys(slots.summary) && hasKeys(summary))
    || (!hasKeys(slots.section) && hasKeys(section))
    || (!hasKeys(slots.modals) && hasKeys(modals))
  );

  useEffect(() => {
    if (!import.meta.env.DEV || import.meta.env.MODE === 'test') {
      return;
    }

    if (!usesLegacyProps || hasWarnedLegacyProps.current) {
      return;
    }

    console.warn(
      `[CrudPageTemplate] Legacy props { summary, section, modals } are deprecated and will be removed after ${LEGACY_PROPS_REMOVAL_TARGET}. Please migrate to slots.summary, slots.section, and slots.modals.`,
    );
    hasWarnedLegacyProps.current = true;
  }, [usesLegacyProps]);

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
