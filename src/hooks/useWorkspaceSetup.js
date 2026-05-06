import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  WORKSPACE_SETUP_STORAGE_KEY,
  WORKSPACE_SETUP_UPDATED_EVENT,
  WORKSPACE_SETUP_MODES,
  getWorkspaceSetupMode,
  hasWorkspaceSetupChoice,
  saveWorkspaceSetupMode,
} from '../lib/workspaceSetup';
import {
  clearLocalOpportunityDemoData,
  resetLocalOpportunityDemoData,
} from '../lib/opportunitiesRepository';
import {
  clearLocalContentDemoData,
  resetLocalContentDemoData,
} from '../lib/contentRepository';
import {
  clearLocalWeeklyDemoData,
  resetLocalWeeklyDemoData,
} from '../lib/weeklyRepository';

function readWorkspaceSetupState() {
  return {
    mode: getWorkspaceSetupMode(),
    hasChoice: hasWorkspaceSetupChoice(),
  };
}

export function useWorkspaceSetup() {
  const [state, setState] = useState(() => readWorkspaceSetupState());

  const refreshState = useCallback(() => {
    setState(readWorkspaceSetupState());
  }, []);

  useEffect(() => {
    const handleStorageChange = (event) => {
      if (event?.key === null || event?.key === WORKSPACE_SETUP_STORAGE_KEY) {
        refreshState();
      }
    };

    window.addEventListener(WORKSPACE_SETUP_UPDATED_EVENT, refreshState);
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener(WORKSPACE_SETUP_UPDATED_EVENT, refreshState);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [refreshState]);

  const startBlankWorkspace = useCallback(() => {
    saveWorkspaceSetupMode(WORKSPACE_SETUP_MODES.blank);
    clearLocalOpportunityDemoData();
    clearLocalContentDemoData();
    clearLocalWeeklyDemoData();
    refreshState();
  }, [refreshState]);

  const loadDemoWorkspace = useCallback(() => {
    saveWorkspaceSetupMode(WORKSPACE_SETUP_MODES.demo);
    resetLocalOpportunityDemoData();
    resetLocalContentDemoData();
    resetLocalWeeklyDemoData();
    refreshState();
  }, [refreshState]);

  return useMemo(() => ({
    mode: state.mode,
    hasChoice: state.hasChoice,
    isDemoMode: state.mode === WORKSPACE_SETUP_MODES.demo,
    isBlankMode: state.mode === WORKSPACE_SETUP_MODES.blank,
    startBlankWorkspace,
    loadDemoWorkspace,
    clearDemoData: startBlankWorkspace,
  }), [
    loadDemoWorkspace,
    startBlankWorkspace,
    state.hasChoice,
    state.mode,
  ]);
}
