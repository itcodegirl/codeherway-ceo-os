import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useConfirmDelete } from './useConfirmDelete';
import { useIsMountedRef } from './useIsMountedRef';

function isValidCrudItem(value) {
  return Boolean(value && typeof value === 'object' && typeof value.id === 'string' && value.id.trim());
}

export function useCrudPage(config) {
  const {
    listFn,
    createFn,
    updateFn,
    deleteFn,
    defaultForm,
    defaultFormValues,
    validate,
    validatePayload,
    listItems,
    createItem,
    updateItem,
    deleteItem,
    mapItemToFormValues,
    mapFormValuesToPayload,
    getDeleteLabel,
    messages = {},
    logPrefix = 'items',
  } = config || {};

  const listItemsFn = useMemo(() => listFn || listItems, [listFn, listItems]);
  const createItemFn = useMemo(() => createFn || createItem, [createFn, createItem]);
  const updateItemFn = useMemo(() => updateFn || updateItem, [updateFn, updateItem]);
  const deleteItemFn = useMemo(() => deleteFn || deleteItem, [deleteFn, deleteItem]);
  const mapItemToFormValuesFn = mapItemToFormValues;
  const mapFormValuesToPayloadFn = mapFormValuesToPayload;
  const validatePayloadFn = useMemo(() => (
    typeof (validate ?? validatePayload) === 'function'
      ? validate ?? validatePayload
      : () => ''
  ), [validate, validatePayload]);
  const defaultFormValuesResolved = useMemo(
    () => defaultFormValues ?? defaultForm ?? {},
    [defaultFormValues, defaultForm],
  );
  const loadErrorMessage = messages.load || 'Unable to load items right now.';
  const saveErrorMessage = messages.save || 'Unable to save item right now.';
  const deleteErrorMessage = messages.delete || 'Unable to delete item right now.';
  const resolveDeleteMessage = useCallback((itemToDelete) => {
    if (!itemToDelete) {
      return 'Delete this item? This cannot be undone.';
    }

    return typeof getDeleteLabel === 'function'
      ? `Delete "${getDeleteLabel(itemToDelete)}"? This cannot be undone.`
      : 'Delete this item? This cannot be undone.';
  }, [getDeleteLabel]);

  const [isLoading, setIsLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [selectedItemState, setSelectedItemState] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formValues, setFormValues] = useState(defaultFormValuesResolved);
  const [formError, setFormError] = useState('');
  const [loadError, setLoadError] = useState('');
  const selectedItem = selectedItemState;
  const isSavingRef = useRef(false);
  const resetSavingRef = useCallback(() => {
    isSavingRef.current = false;
  }, []);
  const isMountedRef = useIsMountedRef(resetSavingRef);

  const {
    isConfirmOpen: isDeleteConfirmOpen,
    confirmMessage: deletePrompt,
    isConfirmPending: isDeleting,
    requestConfirm,
    closeConfirm: closeDeleteConfirm,
    resetConfirm,
    confirm: confirmDelete,
  } = useConfirmDelete(
    async (itemToDelete) => {
      if (!itemToDelete) {
        return;
      }

      try {
        setLoadError('');
        if (typeof deleteItemFn !== 'function') {
          throw new Error('Delete operation is not configured.');
        }
        await deleteItemFn(itemToDelete.id);
        if (!isMountedRef.current) {
          return;
        }
        setItems((current) => current.filter((item) => item.id !== itemToDelete.id));
        setSelectedItemState(null);
      } catch (error) {
        if (isMountedRef.current) {
          setLoadError(deleteErrorMessage);
        }
        if (import.meta.env.DEV) {
          console.error(`Failed to delete ${logPrefix}`, error);
        }
        throw error;
      }
    },
    resolveDeleteMessage,
  );

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
      if (typeof listItemsFn !== 'function') {
        if (isActive) {
          setItems([]);
          setLoadError(loadErrorMessage);
          setIsLoading(false);
        }
        return;
      }
      try {
        const nextItems = await listItemsFn();
        if (!Array.isArray(nextItems)) {
          if (isActive) {
            setItems([]);
            setLoadError(loadErrorMessage);
          }
          if (import.meta.env.DEV) {
            console.error(`Failed to load ${logPrefix}`, new Error('List operation returned a non-array result.'));
          }
          return;
        }
        if (isActive) {
          setItems(nextItems);
        }
      } catch (error) {
        if (!isActive) {
          return;
        }
        setLoadError(loadErrorMessage);
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
  }, [listItemsFn, loadErrorMessage, logPrefix]);

  const resetForm = useCallback(() => {
    setFormValues(defaultFormValuesResolved);
    setFormError('');
  }, [defaultFormValuesResolved]);

  const handleOpenCreateModal = useCallback(() => {
    setSelectedItem(null);
    resetForm();
    setIsFormOpen(true);
  }, [resetForm, setSelectedItem]);

  const handleOpenEditModal = useCallback(() => {
    if (!selectedItem || !mapItemToFormValuesFn) {
      return;
    }

    setFormValues(mapItemToFormValuesFn(selectedItem));
    setFormError('');
    closeDeleteConfirm();
    setIsFormOpen(true);
  }, [closeDeleteConfirm, mapItemToFormValuesFn, selectedItem]);

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

    requestConfirm(selectedItem);
  }, [isDeleting, requestConfirm, selectedItem]);

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
    if (isSavingRef.current) {
      return;
    }

    const payload = mapFormValuesToPayloadFn ? mapFormValuesToPayloadFn(formValues) : formValues;
    const validationError = validatePayloadFn(payload);

    if (validationError) {
      setFormError(validationError);
      return;
    }

    if (selectedItem && typeof updateItemFn !== 'function') {
      setFormError(saveErrorMessage);
      return;
    }
    if (!selectedItem && typeof createItemFn !== 'function') {
      setFormError(saveErrorMessage);
      return;
    }

    isSavingRef.current = true;
    setIsSaving(true);
    setFormError('');
    setLoadError('');

    try {
      if (selectedItem) {
        const updated = await updateItemFn(selectedItem.id, payload);
        if (!isMountedRef.current) {
          return;
        }
        if (!isValidCrudItem(updated)) {
          throw new Error('Update operation returned an invalid item shape.');
        }
        setItems((current) =>
          current.map((item) => (item.id === updated.id ? updated : item)));
        setSelectedItemState(updated);
      } else {
        const created = await createItemFn(payload);
        if (!isMountedRef.current) {
          return;
        }
        if (!isValidCrudItem(created)) {
          throw new Error('Create operation returned an invalid item shape.');
        }
        setItems((current) => [created, ...current]);
      }

      setIsFormOpen(false);
      resetForm();
    } catch (error) {
      if (isMountedRef.current) {
        setFormError(saveErrorMessage);
      }
      if (import.meta.env.DEV) {
        console.error(`Failed to save ${logPrefix}`, error);
      }
    } finally {
      isSavingRef.current = false;
      if (isMountedRef.current) {
        setIsSaving(false);
      }
    }
  }, [
    createItemFn,
    formValues,
    isMountedRef,
    logPrefix,
    mapFormValuesToPayloadFn,
    saveErrorMessage,
    resetForm,
    selectedItem,
    updateItemFn,
    validatePayloadFn,
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
