import SectionCard from '../ui/SectionCard';
import ConfirmModal from '../ui/ConfirmModal';
import WeeklyPriorities from './WeeklyPriorities';
import WeeklyEditorModal from './WeeklyEditorModal';
import { useWeeklySectionEditor } from '../../hooks/useWeeklySectionEditor';

function PrioritiesSection({ items, setItems, defaultItems }) {
  const priorityItems = Array.isArray(items) ? items : defaultItems;
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
    type: 'priority',
    defaultItems,
    setItems,
  });

  return (
    <>
      <SectionCard
        title="Priority Track"
        actionText="Add Priority"
        onAction={openCreateEditor}
        actionLabel="Add weekly priority"
      >
        {priorityItems.length ? (
          <WeeklyPriorities
            items={priorityItems}
            onEditItem={openEditEditor}
            onDeleteItem={requestDelete}
          />
        ) : (
          <p className="helper-text">No priorities yet. Add one to define this week&apos;s focus.</p>
        )}
      </SectionCard>

      <WeeklyEditorModal
        isOpen={isEditorOpen}
        title={editorTitle}
        editorType="priority"
        formValues={formValues}
        formError={formError}
        isEditing={isEditing}
        onClose={closeEditor}
        onSubmit={handleEditorSubmit}
        onFormChange={handleFormChange}
      />

      <ConfirmModal
        isOpen={isDeleteConfirmOpen}
        title="Delete Priority"
        message={deletePrompt}
        onCancel={closeDeleteConfirm}
        onConfirm={handleConfirmDelete}
        cancelLabel="Cancel"
        confirmLabel="Delete"
        cancelAriaLabel="Cancel priority delete"
        confirmAriaLabel="Confirm priority delete"
      />
    </>
  );
}

export default PrioritiesSection;
