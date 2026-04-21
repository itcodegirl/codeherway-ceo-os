import { useMemo, useState } from 'react';
import {
  DEFAULT_EDITOR_STATE,
  createEditorPayload,
  getDefaultFormValues,
  getEditorTitle,
  getFormValuesForEdit,
} from '../lib/weeklyBriefEditor';

function getCollectionConfig(type, params) {
  const {
    defaultPriorities,
    defaultWins,
    defaultBlockers,
    setStoredPriorities,
    setStoredWins,
    setStoredBlockers,
  } = params;

  switch (type) {
    case 'priority':
      return {
        defaultItems: defaultPriorities,
        setItems: setStoredPriorities,
      };
    case 'win':
      return {
        defaultItems: defaultWins,
        setItems: setStoredWins,
      };
    case 'blocker':
      return {
        defaultItems: defaultBlockers,
        setItems: setStoredBlockers,
      };
    default:
      return null;
  }
}

function createDefaultDeleteState() {
  return {
    type: '',
    itemId: '',
    itemName: '',
  };
}

export function useWeeklyBriefEditor(params) {
  const [editorState, setEditorState] = useState(DEFAULT_EDITOR_STATE);
  const [formValues, setFormValues] = useState({});
  const [formError, setFormError] = useState('');
  const [deleteState, setDeleteState] = useState(createDefaultDeleteState);

  const isEditorOpen = Boolean(editorState.type);
  const isEditing = Boolean(editorState.itemId);
  const isDeleteConfirmOpen = Boolean(deleteState.type && deleteState.itemId);

  const editorTitle = useMemo(
    () => getEditorTitle(editorState.type, isEditing),
    [editorState.type, isEditing],
  );
  const deletePrompt = useMemo(() => {
    if (!deleteState.itemName) {
      return '';
    }

    return `Delete "${deleteState.itemName}"? This cannot be undone.`;
  }, [deleteState.itemName]);

  const closeEditor = () => {
    setEditorState(DEFAULT_EDITOR_STATE);
    setFormValues({});
    setFormError('');
  };

  const closeDeleteConfirm = () => {
    setDeleteState(createDefaultDeleteState());
  };

  const openCreateEditor = (type) => {
    setEditorState({ type, itemId: '' });
    setFormValues(getDefaultFormValues(type));
    setFormError('');
  };

  const openEditEditor = (type, item) => {
    setEditorState({ type, itemId: String(item.id) });
    setFormValues(getFormValuesForEdit(type, item));
    setFormError('');
  };

  const handleFormChange = (field, value) => {
    setFormValues((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const updateCollection = (type, updater) => {
    const config = getCollectionConfig(type, params);
    if (!config) {
      return;
    }

    config.setItems((current) => {
      const sourceItems = Array.isArray(current) ? current : config.defaultItems;
      return updater(sourceItems);
    });
  };

  const handleDelete = (type, item) => {
    const itemName = type === 'priority' ? item.title : item.text;
    const itemId = item?.id;
    if (!itemName || itemId === null || itemId === undefined) {
      return;
    }

    setDeleteState({
      type,
      itemId: String(itemId),
      itemName,
    });
  };

  const handleConfirmDelete = () => {
    if (!deleteState.type || !deleteState.itemId) {
      return;
    }

    updateCollection(deleteState.type, (items) =>
      items.filter((entry) => String(entry.id) !== deleteState.itemId));
    closeDeleteConfirm();
  };

  const handleEditorSubmit = (event) => {
    event.preventDefault();

    const { payload, error } = createEditorPayload(editorState.type, formValues, editorState.itemId);
    if (error) {
      setFormError(error);
      return;
    }

    updateCollection(editorState.type, (items) => {
      if (!editorState.itemId) {
        return [payload, ...items];
      }

      return items.map((entry) => (String(entry.id) === String(editorState.itemId) ? payload : entry));
    });

    closeEditor();
  };

  return {
    editorState,
    formValues,
    formError,
    isEditorOpen,
    isEditing,
    isDeleteConfirmOpen,
    editorTitle,
    deletePrompt,
    closeEditor,
    closeDeleteConfirm,
    openCreateEditor,
    openEditEditor,
    handleFormChange,
    handleDelete,
    handleConfirmDelete,
    handleEditorSubmit,
  };
}
