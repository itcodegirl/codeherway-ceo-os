import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import StorageCorruptionBanner from './StorageCorruptionBanner';
import { STORAGE_CORRUPTION_EVENT } from '../../lib/storageCorruption';

describe('StorageCorruptionBanner', () => {
  afterEach(() => {
    window.localStorage.clear?.();
  });

  it('renders nothing until a storage corruption event fires', () => {
    render(<StorageCorruptionBanner />);
    expect(screen.queryByTestId('storage-corruption-banner')).not.toBeInTheDocument();
  });

  it('shows a recovery banner with the affected key when an event fires', () => {
    render(<StorageCorruptionBanner />);

    act(() => {
      window.dispatchEvent(
        new CustomEvent(STORAGE_CORRUPTION_EVENT, {
          detail: {
            key: 'ceo-os-journal-2026-04-30',
            backupKey: 'ceo-os-journal-2026-04-30__corrupt_1',
            message: 'invalid json',
          },
        }),
      );
    });

    expect(screen.getByTestId('storage-corruption-banner')).toBeInTheDocument();
    expect(screen.getByText(/ceo-os-journal-2026-04-30/)).toBeInTheDocument();
  });

  it('dismisses the banner when the user clicks Dismiss', () => {
    render(<StorageCorruptionBanner />);

    act(() => {
      window.dispatchEvent(
        new CustomEvent(STORAGE_CORRUPTION_EVENT, {
          detail: { key: 'ceo-os-test', backupKey: null, message: 'x' },
        }),
      );
    });

    fireEvent.click(screen.getByRole('button', { name: /dismiss/i }));

    expect(screen.queryByTestId('storage-corruption-banner')).not.toBeInTheDocument();
  });
});
