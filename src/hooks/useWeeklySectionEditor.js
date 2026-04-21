import { useMemo, useState } from 'react';
import {
  getDefaultFormValues,
  getEditorTitle,
  getFormValuesForEdit,
  buildWeeklyPayload,
} from '../lib/weeklyBriefEditor';
import { useConfirmDelete } from './useConfirmDelete';

function getItemName(type, item) {
  if (!item) {
    return '';
  }

  return type === 'priority' ? item.title : item.text;
}

export function useWeeklySectionEditor({ type, defaultItems, setItems }) {
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editorItemId, setEditorItemId] = useState('');
  const [formValues, setFormValues] = useState({});
  const [formError, setFormError] = useState('');

  const {
    isConfirmOpen: isDeleteConfirmOpen,
    confirmMessage: deletePrompt,
    requestConfirm,
    closeConfirm: closeDeleteConfirm,
    confirm: handleConfirmDelete,
  } = useConfirmDelete(
    async (itemToDelete) => {
      const itemId = itemToDelete?.id;
      if (itemId === null || itemId === undefined) {
        return;
      }

      setItems((current) => {
        const sourceItems = Array.isArray(current) ? current : defaultItems;
        return sourceItems.filter((item) => String(item.id) !== String(itemId));
      });
    },
    (itemToDelete) => {
      const itemName = getItemName(type, itemToDelete);
      if (!itemName) {
        return 'Delete this item? This cannot be undone.';
      }

      return `Delete "${itemName}"? This cannot be undone.`;
    },
  );

  const isEditing = Boolean(editorItemId);

  const editorTitle = useMemo(() => getEditorTitle(type, isEditing), [isEditing, type]);

  const closeEditor = () => {
    setIsEditorOpen(false);
    setEditorItemId('');
    setFormValues({});
    setFormError('');
  };

  const openCreateEditor = () => {
    setIsEditorOpen(true);
    setEditorItemId('');
    setFormValues(getDefaultFormValues(type));
    setFormError('');
  };

  const openEditEditor = (item) => {
    const itemId = item?.id;
    if (itemId === null || itemId === undefined) {
      return;
    }

    setIsEditorOpen(true);
    setEditorItemId(String(itemId));
    setFormValues(getFormValuesForEdit(type, item));
    setFormError('');
  };

  const handleFormChange = (field, value) => {
    setFormValues((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const requestDelete = (item) => {
    requestConfirm(item);
  };

  const handleEditorSubmit = (event) => {
    event.preventDefault();

    const { payload, error } = buildWeeklyPayload(type, formValues, editorItemId);
    if (error) {
      setFormError(error);
      return;
    }

    setItems((current) => {
      const sourceItems = Array.isArray(current) ? current : defaultItems;

      if (!editorItemId) {
        return [payload, ...sourceItems];
      }

      return sourceItems.map((item) => (String(item.id) === editorItemId ? payload : item));
    });

    closeEditor();
  };

  return {
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
  };
}
