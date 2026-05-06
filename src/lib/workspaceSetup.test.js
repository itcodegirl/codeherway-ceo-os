import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  WORKSPACE_SETUP_UPDATED_EVENT,
  getWorkspaceSetupMode,
  hasWorkspaceSetupChoice,
  saveWorkspaceSetupMode,
} from './workspaceSetup';

describe('src/lib/workspaceSetup', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('defaults to demo mode until the user makes an explicit setup choice', () => {
    expect(hasWorkspaceSetupChoice()).toBe(false);
    expect(getWorkspaceSetupMode()).toBe('demo');
  });

  it('persists the chosen setup mode and emits an update event', () => {
    const listener = vi.fn();
    window.addEventListener(WORKSPACE_SETUP_UPDATED_EVENT, listener);

    try {
      expect(saveWorkspaceSetupMode('blank')).toBe('blank');
    } finally {
      window.removeEventListener(WORKSPACE_SETUP_UPDATED_EVENT, listener);
    }

    expect(hasWorkspaceSetupChoice()).toBe(true);
    expect(getWorkspaceSetupMode()).toBe('blank');
    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: expect.objectContaining({ mode: 'blank' }),
      }),
    );
  });

  it('ignores invalid setup modes', () => {
    expect(saveWorkspaceSetupMode('not-real')).toBe('demo');
    expect(hasWorkspaceSetupChoice()).toBe(false);
  });
});
