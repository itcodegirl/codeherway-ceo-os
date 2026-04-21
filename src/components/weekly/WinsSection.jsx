import SectionCard from '../ui/SectionCard';
import ConfirmModal from '../ui/ConfirmModal';
import WeeklyTextList from './WeeklyTextList';
import WeeklyEditorModal from './WeeklyEditorModal';
import { useWeeklySectionEditor } from '../../hooks/useWeeklySectionEditor';

function WinsSection({ items, setItems, defaultItems }) {
  const winItems = Array.isArray(items) ? items : defaultItems;
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
    type: 'win',
    defaultItems,
    setItems,
  });

  return (
    <>
      <SectionCard
        title="Wins / Momentum"
        actionText="Add Win"
        onAction={openCreateEditor}
        actionLabel="Add weekly win"
      >
        {winItems.length ? (
          <WeeklyTextList
            items={winItems}
            itemTypeLabel="win"
            getDotClassName={() => 'weekly-list__dot--success'}
            getPrimaryText={(item) => item.text}
            getSecondaryText={(item) => `Category: ${item.category}`}
            onEditItem={openEditEditor}
            onDeleteItem={requestDelete}
          />
        ) : (
          <p className="helper-text">No wins captured yet. Add one to preserve momentum context.</p>
        )}
      </SectionCard>

      <WeeklyEditorModal
        isOpen={isEditorOpen}
        title={editorTitle}
        editorType="win"
        formValues={formValues}
        formError={formError}
        isEditing={isEditing}
        onClose={closeEditor}
        onSubmit={handleEditorSubmit}
        onFormChange={handleFormChange}
      />

      <ConfirmModal
        isOpen={isDeleteConfirmOpen}
        title="Delete Win"
        message={deletePrompt}
        onCancel={closeDeleteConfirm}
        onConfirm={handleConfirmDelete}
        cancelLabel="Cancel"
        confirmLabel="Delete"
        cancelAriaLabel="Cancel win delete"
        confirmAriaLabel="Confirm win delete"
      />
    </>
  );
}

export default WinsSection;
