import { useMemo, useState } from 'react';
import {
  createEditorPayload,
  getDefaultFormValues,
  getEditorTitle,
  getFormValuesForEdit,
} from '../lib/weeklyBriefEditor';

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
  const [deleteState, setDeleteState] = useState({ itemId: '', itemName: '' });

  const isEditing = Boolean(editorItemId);
  const isDeleteConfirmOpen = Boolean(deleteState.itemId);

  const editorTitle = useMemo(() => getEditorTitle(type, isEditing), [isEditing, type]);
  const deletePrompt = useMemo(() => {
    if (!deleteState.itemName) {
      return '';
    }

    return `Delete "${deleteState.itemName}"? This cannot be undone.`;
  }, [deleteState.itemName]);

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
    const itemId = item?.id;
    const itemName = getItemName(type, item);
    if (itemId === null || itemId === undefined || !itemName) {
      return;
    }

    setDeleteState({
      itemId: String(itemId),
      itemName,
    });
  };

  const closeDeleteConfirm = () => {
    setDeleteState({ itemId: '', itemName: '' });
  };

  const handleConfirmDelete = () => {
    if (!deleteState.itemId) {
      return;
    }

    setItems((current) => {
      const sourceItems = Array.isArray(current) ? current : defaultItems;
      return sourceItems.filter((item) => String(item.id) !== deleteState.itemId);
    });
    closeDeleteConfirm();
  };

  const handleEditorSubmit = (event) => {
    event.preventDefault();

    const { payload, error } = createEditorPayload(type, formValues, editorItemId);
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
