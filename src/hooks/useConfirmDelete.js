import { useCallback, useState } from 'react';

const DEFAULT_CONFIRM_STATE = {
  isOpen: false,
  message: '',
  payload: null,
};

export function useConfirmDelete({ onConfirm }) {
  const [confirmState, setConfirmState] = useState(DEFAULT_CONFIRM_STATE);
  const [isConfirmPending, setIsConfirmPending] = useState(false);

  const requestConfirm = useCallback(({ message, payload }) => {
    if (isConfirmPending) {
      return;
    }

    setConfirmState({
      isOpen: true,
      message: message || '',
      payload: payload ?? null,
    });
  }, [isConfirmPending]);

  const closeConfirm = useCallback(() => {
    if (isConfirmPending) {
      return;
    }

    setConfirmState(DEFAULT_CONFIRM_STATE);
  }, [isConfirmPending]);

  const resetConfirm = useCallback(() => {
    setConfirmState(DEFAULT_CONFIRM_STATE);
    setIsConfirmPending(false);
  }, []);

  const confirm = useCallback(async () => {
    if (!confirmState.isOpen) {
      return;
    }

    setIsConfirmPending(true);
    try {
      await onConfirm?.(confirmState.payload);
      setConfirmState(DEFAULT_CONFIRM_STATE);
    } finally {
      setIsConfirmPending(false);
    }
  }, [confirmState.isOpen, confirmState.payload, onConfirm]);

  return {
    isConfirmOpen: confirmState.isOpen,
    confirmMessage: confirmState.message,
    confirmPayload: confirmState.payload,
    isConfirmPending,
    requestConfirm,
    closeConfirm,
    resetConfirm,
    confirm,
  };
}
