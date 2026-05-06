import { useCallback, useState } from 'react';
import SectionCard from '../ui/SectionCard';
import ConfirmModal from '../ui/ConfirmModal';
import WeeklyTextList from './WeeklyTextList';
import WeeklyEditorModal from './WeeklyEditorModal';
import { useWeeklySectionEditor } from '../../hooks/useWeeklySectionEditor';

function BlockersSection({ items, setItems, defaultItems }) {
  const blockerItems = Array.isArray(items) ? items : defaultItems;
  const [impactMessage, setImpactMessage] = useState('');
  const setBlockerItems = useCallback((nextValue) => {
    setItems(nextValue);
    setImpactMessage('This will influence your Focus Home recommendations.');
  }, [setItems]);
  const {
    formValues,
    formError,
    isEditorOpen,
    isEditing,
    isDeleteConfirmOpen,
    editorTitle,
    deletePrompt,
    closeEditor,
    openCreateEditor,
    openEditEditor,
    handleFormChange,
    requestDelete,
    closeDeleteConfirm,
    handleConfirmDelete,
    handleEditorSubmit,
  } = useWeeklySectionEditor({
    type: 'blocker',
    defaultItems,
    setItems: setBlockerItems,
  });

  return (
    <>
      <SectionCard
        title="Top Blockers"
        iconName="weekly"
        actionText="Add Blocker"
        onAction={openCreateEditor}
        actionLabel="Add weekly blocker"
      >
        {blockerItems.length ? (
          <WeeklyTextList
            items={blockerItems}
            itemTypeLabel="blocker"
            getDotClassName={(item) => `weekly-list__dot--${item.severity}`}
            getPrimaryText={(item) => item.text}
            onEditItem={openEditEditor}
            onDeleteItem={requestDelete}
          />
        ) : (
          <p className="helper-text">No blockers logged. Add blockers to keep risk visible.</p>
        )}
        {impactMessage ? <p className="helper-text weekly-impact-copy" role="status">{impactMessage}</p> : null}
      </SectionCard>

      <WeeklyEditorModal
        isOpen={isEditorOpen}
        title={editorTitle}
        editorType="blocker"
        formValues={formValues}
        formError={formError}
        isEditing={isEditing}
        onClose={closeEditor}
        onSubmit={handleEditorSubmit}
        onFormChange={handleFormChange}
      />

      <ConfirmModal
        isOpen={isDeleteConfirmOpen}
        title="Delete Blocker"
        message={deletePrompt}
        onCancel={closeDeleteConfirm}
        onConfirm={handleConfirmDelete}
        cancelLabel="Cancel"
        confirmLabel="Delete"
        cancelAriaLabel="Cancel blocker delete"
        confirmAriaLabel="Confirm blocker delete"
      />
    </>
  );
}

export default BlockersSection;
