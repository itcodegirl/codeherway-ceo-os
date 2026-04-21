import { useCallback, useEffect, useState } from 'react';
import { useConfirmDelete } from './useConfirmDelete';

export function useCrudPage({
  defaultFormValues,
  listItems,
  createItem,
  updateItem,
  deleteItem,
  mapItemToFormValues,
  mapFormValuesToPayload,
  validatePayload,
  getDeleteLabel,
  messages,
  logPrefix,
}) {
  const [isLoading, setIsLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [selectedItemState, setSelectedItemState] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formValues, setFormValues] = useState(defaultFormValues);
  const [formError, setFormError] = useState('');
  const [loadError, setLoadError] = useState('');
  const selectedItem = selectedItemState;

  const {
    isConfirmOpen: isDeleteConfirmOpen,
    confirmMessage: deletePrompt,
    isConfirmPending: isDeleting,
    requestConfirm,
    closeConfirm: closeDeleteConfirm,
    resetConfirm,
    confirm: confirmDelete,
  } = useConfirmDelete({
    onConfirm: async (itemToDelete) => {
      if (!itemToDelete) {
        return;
      }

      try {
        await deleteItem(itemToDelete.id);
        setItems((current) => current.filter((item) => item.id !== itemToDelete.id));
        setSelectedItemState(null);
      } catch (error) {
        setLoadError(messages.delete);
        if (import.meta.env.DEV) {
          console.error(`Failed to delete ${logPrefix}`, error);
        }
        throw error;
      }
    },
  });

  const setSelectedItem = useCallback((nextItem) => {
    setSelectedItemState(nextItem);
    if (!nextItem) {
      resetConfirm();
    }
  }, [resetConfirm]);

  useEffect(() => {
    let isActive = true;

    const load = async () => {
      setIsLoading(true);
      setLoadError('');
      try {
        const nextItems = await listItems();
        if (isActive) {
          setItems(nextItems);
        }
      } catch (error) {
        if (!isActive) {
          return;
        }
        setLoadError(messages.load);
        if (import.meta.env.DEV) {
          console.error(`Failed to load ${logPrefix}`, error);
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    load();

    return () => {
      isActive = false;
    };
  }, [listItems, logPrefix, messages.load]);

  const resetForm = useCallback(() => {
    setFormValues(defaultFormValues);
    setFormError('');
  }, [defaultFormValues]);

  const handleOpenCreateModal = useCallback(() => {
    setSelectedItem(null);
    resetForm();
    setIsFormOpen(true);
  }, [resetForm, setSelectedItem]);

  const handleOpenEditModal = useCallback(() => {
    if (!selectedItem) {
      return;
    }

    setFormValues(mapItemToFormValues(selectedItem));
    setFormError('');
    closeDeleteConfirm();
    setIsFormOpen(true);
  }, [closeDeleteConfirm, mapItemToFormValues, selectedItem]);

  const handleCloseFormModal = useCallback(() => {
    if (isSaving) {
      return;
    }

    setIsFormOpen(false);
    setFormError('');
  }, [isSaving]);

  const handleOpenDeleteConfirm = useCallback(() => {
    if (!selectedItem || isDeleting) {
      return;
    }

    requestConfirm({
      message: `Delete "${getDeleteLabel(selectedItem)}"? This cannot be undone.`,
      payload: selectedItem,
    });
  }, [getDeleteLabel, isDeleting, requestConfirm, selectedItem]);

  const handleCloseDeleteConfirm = useCallback(() => {
    closeDeleteConfirm();
  }, [closeDeleteConfirm]);

  const handleFormChange = useCallback((field, value) => {
    setFormValues((current) => ({
      ...current,
      [field]: value,
    }));
  }, []);

  const handleFormSubmit = useCallback(async (event) => {
    event.preventDefault();
    const payload = mapFormValuesToPayload(formValues);
    const validationError = validatePayload(payload);

    if (validationError) {
      setFormError(validationError);
      return;
    }

    setIsSaving(true);
    setFormError('');

    try {
      if (selectedItem) {
        const updated = await updateItem(selectedItem.id, payload);
        setItems((current) =>
          current.map((item) => (item.id === updated.id ? updated : item)));
        setSelectedItemState(updated);
      } else {
        const created = await createItem(payload);
        setItems((current) => [created, ...current]);
      }

      setIsFormOpen(false);
      resetForm();
    } catch (error) {
      setFormError(messages.save);
      if (import.meta.env.DEV) {
        console.error(`Failed to save ${logPrefix}`, error);
      }
    } finally {
      setIsSaving(false);
    }
  }, [
    createItem,
    formValues,
    logPrefix,
    mapFormValuesToPayload,
    messages.save,
    resetForm,
    selectedItem,
    updateItem,
    validatePayload,
  ]);

  const handleConfirmDeleteSelected = useCallback(async () => {
    try {
      await confirmDelete();
    } catch {
      // Error state is already set in onConfirm; keep modal open so the user can retry.
    }
  }, [confirmDelete]);

  return {
    isLoading,
    items,
    selectedItem,
    setSelectedItem,
    isFormOpen,
    isDeleteConfirmOpen,
    isSaving,
    isDeleting,
    formValues,
    formError,
    loadError,
    handleOpenCreateModal,
    handleOpenEditModal,
    handleCloseFormModal,
    handleFormChange,
    handleFormSubmit,
    handleOpenDeleteConfirm,
    handleCloseDeleteConfirm,
    handleConfirmDeleteSelected,
    deletePrompt,
  };
}
