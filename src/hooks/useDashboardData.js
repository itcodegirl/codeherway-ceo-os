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

const SILENT_REFRESH_COALESCE_MS = 400;

export const isLocalDashboardDemoMode = getOpportunitiesSource() === 'local' && getContentSource() === 'local';

export function useDashboardData({ onLoadError }) {
  const [opportunityItems, setOpportunityItems] = useState([]);
  const [contentRows, setContentRows] = useState([]);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const isMountedRef = useRef(true);
  const onLoadErrorRef = useRef(onLoadError);
  const requestIdRef = useRef(0);
  const lastSilentRefreshAtRef = useRef(0);

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
      } catch (error) {
        if (!isMountedRef.current || requestId !== requestIdRef.current) {
          return;
        }

        onLoadErrorRef.current?.(error);
      } finally {
        if (!silent && isMountedRef.current && requestId === requestIdRef.current) {
          setIsDataLoading(false);
        }
      }
    },
    [],
  );

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      loadDashboardData();
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [loadDashboardData]);

  useEffect(() => {
    const requestSilentRefresh = () => {
      const now = Date.now();
      if (now - lastSilentRefreshAtRef.current < SILENT_REFRESH_COALESCE_MS) {
        return;
      }

      lastSilentRefreshAtRef.current = now;
      loadDashboardData({ silent: true });
    };

    const handleStorageChange = (event) => {
      if (
        event.key === 'ceo-os-opportunities'
        || event.key === 'ceo-os-content-items'
        || event.key === null
      ) {
        requestSilentRefresh();
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        requestSilentRefresh();
      }
    };

    window.addEventListener(OPPORTUNITIES_UPDATED_EVENT, requestSilentRefresh);
    window.addEventListener(CONTENT_ITEMS_UPDATED_EVENT, requestSilentRefresh);
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('focus', requestSilentRefresh);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener(OPPORTUNITIES_UPDATED_EVENT, requestSilentRefresh);
      window.removeEventListener(CONTENT_ITEMS_UPDATED_EVENT, requestSilentRefresh);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('focus', requestSilentRefresh);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [loadDashboardData]);

  return {
    opportunityItems,
    contentRows,
    isDataLoading,
    loadDashboardData,
  };
}
