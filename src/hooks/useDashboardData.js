import { useCallback, useEffect, useRef, useState } from 'react';
import {
  getOpportunitiesSource,
  listOpportunities,
  OPPORTUNITIES_UPDATED_EVENT,
} from '../lib/opportunitiesRepository';
import {
  CONTENT_ITEMS_UPDATED_EVENT,
  getContentSource,
  listContentItems,
} from '../lib/contentRepository';
import { shallowEqualRecordArrays } from '../lib/stateUtils';
import { isDemoWorkspaceEnabled } from '../lib/workspaceSetup';
import { useIsMountedRef } from './useIsMountedRef';
import { useSilentRefresh } from './useSilentRefresh';

// Audit follow-up: the load/coalesce/subscribe pattern that used to live
// inline here is now shared with useFocusHomeSignals / useWeeklyBrief /
// useWorkspaceSettings via useSilentRefresh, so each hook focuses on its
// data shape instead of re-implementing event plumbing.
const DASHBOARD_EVENTS = [OPPORTUNITIES_UPDATED_EVENT, CONTENT_ITEMS_UPDATED_EVENT];
const DASHBOARD_STORAGE_KEYS = ['ceo-os-opportunities', 'ceo-os-content-items'];

export const isLocalDashboardDemoMode = getOpportunitiesSource() === 'local'
  && getContentSource() === 'local'
  && isDemoWorkspaceEnabled();

export function useDashboardData({ onLoadError }) {
  const [opportunityItems, setOpportunityItems] = useState([]);
  const [contentRows, setContentRows] = useState([]);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const isMountedRef = useIsMountedRef();
  const onLoadErrorRef = useRef(onLoadError);
  const requestIdRef = useRef(0);

  useEffect(() => {
    onLoadErrorRef.current = onLoadError;
  }, [onLoadError]);

  const loadDashboardData = useCallback(
    async ({ silent = false } = {}) => {
      const requestId = requestIdRef.current + 1;
      requestIdRef.current = requestId;

      if (!silent) {
        setIsDataLoading(true);
      }

      try {
        const [nextOpportunities, nextContentRows] = await Promise.all([
          listOpportunities(),
          listContentItems(),
        ]);

        if (!isMountedRef.current || requestId !== requestIdRef.current) {
          return;
        }

        setOpportunityItems((current) => (
          shallowEqualRecordArrays(current, nextOpportunities) ? current : nextOpportunities
        ));
        setContentRows((current) => (
          shallowEqualRecordArrays(current, nextContentRows) ? current : nextContentRows
        ));
        setLoadError('');
      } catch (error) {
        if (!isMountedRef.current || requestId !== requestIdRef.current) {
          return;
        }

        setLoadError('Unable to load focus data right now.');
        // Wrap consumer callback so a thrown showToast (e.g. fired after
        // unmount) doesn't escape as an unhandled rejection.
        try {
          onLoadErrorRef.current?.(error);
        } catch (callbackError) {
          if (import.meta.env.DEV) {
            console.error('useDashboardData onLoadError callback threw', callbackError);
          }
        }
      } finally {
        if (!silent && isMountedRef.current && requestId === requestIdRef.current) {
          setIsDataLoading(false);
        }
      }
    },
    [isMountedRef],
  );

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      loadDashboardData().catch(() => {});
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [loadDashboardData]);

  const silentRefresh = useCallback(() => {
    loadDashboardData({ silent: true }).catch(() => {});
  }, [loadDashboardData]);

  useSilentRefresh({
    events: DASHBOARD_EVENTS,
    storageKeys: DASHBOARD_STORAGE_KEYS,
    onRefresh: silentRefresh,
  });

  return {
    opportunityItems,
    contentRows,
    isDataLoading,
    loadError,
    loadDashboardData,
  };
}
