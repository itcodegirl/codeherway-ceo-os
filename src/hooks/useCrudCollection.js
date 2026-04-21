import { useEffect, useState } from 'react';

export function useCrudCollection({
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
  const [selectedItem, setSelectedItem] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [formValues, setFormValues] = useState(defaultFormValues);
  const [formError, setFormError] = useState('');
  const [loadError, setLoadError] = useState('');

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

  const resetForm = () => {
    setFormValues(defaultFormValues);
    setFormError('');
  };

  const handleOpenCreateModal = () => {
    setSelectedItem(null);
    resetForm();
    setIsFormOpen(true);
  };

  const handleOpenEditModal = () => {
    if (!selectedItem) {
      return;
    }

    setFormValues(mapItemToFormValues(selectedItem));
    setFormError('');
    setIsFormOpen(true);
  };

  const handleCloseFormModal = () => {
    if (isSaving) {
      return;
    }

    setIsFormOpen(false);
    setFormError('');
  };

  const handleFormChange = (field, value) => {
    setFormValues((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleFormSubmit = async (event) => {
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
          current.map((item) => (item.id === updated.id ? updated : item)),
        );
        setSelectedItem(updated);
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
  };

  const handleDeleteSelected = async () => {
    if (!selectedItem) {
      return;
    }

    const shouldDelete = window.confirm(`Delete "${getDeleteLabel(selectedItem)}"? This cannot be undone.`);
    if (!shouldDelete) {
      return;
    }

    setIsDeleting(true);
    try {
      await deleteItem(selectedItem.id);
      setItems((current) => current.filter((item) => item.id !== selectedItem.id));
      setSelectedItem(null);
    } catch (error) {
      setLoadError(messages.delete);
      if (import.meta.env.DEV) {
        console.error(`Failed to delete ${logPrefix}`, error);
      }
    } finally {
      setIsDeleting(false);
    }
  };

  return {
    isLoading,
    items,
    selectedItem,
    setSelectedItem,
    isFormOpen,
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
    handleDeleteSelected,
  };
}
