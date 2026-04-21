import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Modal from './Modal';

function ModalContent() {
  return (
    <div>
      <button type="button">First action</button>
      <button type="button">Last action</button>
    </div>
  );
}

describe('src/components/ui/Modal', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('traps focus in the modal with Tab and Shift+Tab', async () => {
    const onClose = vi.fn();

    render(
      <Modal isOpen title="Confirm delete" onClose={onClose}>
        <ModalContent />
      </Modal>,
    );

    const closeButton = screen.getByRole('button', { name: 'Close dialog' });
    const lastActionButton = screen.getByRole('button', { name: 'Last action' });

    await waitFor(() => {
      expect(closeButton).toHaveFocus();
    });

    lastActionButton.focus();
    expect(lastActionButton).toHaveFocus();

    fireEvent.keyDown(document, { key: 'Tab' });
    expect(closeButton).toHaveFocus();

    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });
    expect(lastActionButton).toHaveFocus();
  });

  it('restores focus to the previously active element after closing', () => {
    const onClose = vi.fn();
    const { rerender } = render(
      <div>
        <button type="button">Open modal</button>
        <Modal isOpen={false} title="Confirm delete" onClose={onClose}>
          <ModalContent />
        </Modal>
      </div>,
    );

    const triggerButton = screen.getByRole('button', { name: 'Open modal' });
    triggerButton.focus();
    expect(triggerButton).toHaveFocus();

    rerender(
      <div>
        <button type="button">Open modal</button>
        <Modal isOpen title="Confirm delete" onClose={onClose}>
          <ModalContent />
        </Modal>
      </div>,
    );

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);

    rerender(
      <div>
        <button type="button">Open modal</button>
        <Modal isOpen={false} title="Confirm delete" onClose={onClose}>
          <ModalContent />
        </Modal>
      </div>,
    );

    expect(triggerButton).toHaveFocus();
  });
});
