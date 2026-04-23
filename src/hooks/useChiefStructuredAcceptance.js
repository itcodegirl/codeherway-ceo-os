import { useCallback, useRef, useState } from 'react';
import { createOpportunity, listOpportunities } from '../lib/opportunitiesRepository';
import { createContentItem, listContentItems } from '../lib/contentRepository';
import { createWeeklyItem, getCurrentWeekStart, getWeeklyBriefByWeek } from '../lib/weeklyRepository';
import { buildCreateId } from '../lib/utils';

const ACCEPTANCE_STATUS = {
  SAVED: 'saved',
  SKIPPED: 'skipped',
  FAILED: 'failed',
};

function resolveStructuredText(item) {
  if (typeof item === 'string') {
    return item.trim();
  }

  if (!item || typeof item !== 'object') {
    return '';
  }

  return (
    item.title
    || item.name
    || item.text
    || item.summary
    || item.task
    || ''
  ).toString().trim();
}

function normalizeComparableValue(value) {
  return String(value || '').trim().toLowerCase();
}

function buildOpportunitySignature(value) {
  const normalizedName = normalizeComparableValue(value?.name || value?.title || value?.text || value?.summary || value?.task);
  const normalizedCompany = normalizeComparableValue(value?.company || value?.organization);
  return normalizedName ? `${normalizedName}|${normalizedCompany}` : '';
}

function buildContentSignature(value) {
  const normalizedTitle = normalizeComparableValue(value?.title || value?.name || value?.text || value?.summary || value?.task);
  const normalizedPlatform = normalizeComparableValue(value?.platform || value?.channel);
  return normalizedTitle ? `${normalizedTitle}|${normalizedPlatform}` : '';
}

function buildPrioritySignature(value) {
  const normalizedTitle = normalizeComparableValue(value?.title || value?.name || value?.text || value?.summary || value?.task);
  return normalizedTitle || '';
}

function createStructuredItemKey(section, item) {
  const sectionKey = typeof section === 'string' ? section : '';
  const itemValue = item && typeof item === 'object' ? item : { title: resolveStructuredText(item) };

  if (sectionKey === 'opportunities') {
    const name = normalizeComparableValue(itemValue.name || itemValue.title || itemValue.text || itemValue.summary || itemValue.task);
    const company = normalizeComparableValue(itemValue.company || itemValue.organization);
    return name ? `${sectionKey}:${name}|${company}` : '';
  }

  if (sectionKey === 'contentItems') {
    const title = normalizeComparableValue(itemValue.title || itemValue.name || itemValue.text || itemValue.summary || itemValue.task);
    const platform = normalizeComparableValue(itemValue.platform || itemValue.channel);
    return title ? `${sectionKey}:${title}|${platform}` : '';
  }

  if (sectionKey === 'priorities' || sectionKey === 'tasks') {
    const title = normalizeComparableValue(itemValue.title || itemValue.name || itemValue.text || itemValue.summary || itemValue.task);
    const owner = normalizeComparableValue(itemValue.owner || itemValue.assignee);
    return title ? `${sectionKey}:${title}|${owner}` : '';
  }

  return '';
}

export function useChiefStructuredAcceptance({
  responses = [],
  setFeedback,
  setLoadError,
  trackTelemetry,
  isMountedRef,
}) {
  const [acceptedStructuredItemMap, setAcceptedStructuredItemMap] = useState({});
  const [acceptingStructuredItemMap, setAcceptingStructuredItemMap] = useState({});
  const [isAcceptingAll, setIsAcceptingAll] = useState(false);
  const acceptedStructuredItemMapRef = useRef({});
  const acceptingStructuredItemMapRef = useRef({});
  const acceptingStructuredItemRef = useRef(new Set());
  const acceptingAllRef = useRef(false);
  const opportunitySignaturesRef = useRef(null);
  const contentSignaturesRef = useRef(null);
  const weeklyPrioritySignaturesByWeekRef = useRef(new Map());

  const notifyTelemetry = useCallback((eventName, payload = {}) => {
    if (typeof trackTelemetry === 'function') {
      trackTelemetry(eventName, payload);
    }
  }, [trackTelemetry]);

  const updateAcceptedStructuredItemMap = useCallback((nextOrUpdater) => {
    setAcceptedStructuredItemMap((current) => {
      const next = typeof nextOrUpdater === 'function' ? nextOrUpdater(current) : nextOrUpdater;
      acceptedStructuredItemMapRef.current = next;
      return next;
    });
  }, []);

  const updateAcceptingStructuredItemMap = useCallback((nextOrUpdater) => {
    setAcceptingStructuredItemMap((current) => {
      const next = typeof nextOrUpdater === 'function' ? nextOrUpdater(current) : nextOrUpdater;
      acceptingStructuredItemMapRef.current = next;
      return next;
    });
  }, []);

  const resetAcceptanceCaches = useCallback(() => {
    opportunitySignaturesRef.current = null;
    contentSignaturesRef.current = null;
    weeklyPrioritySignaturesByWeekRef.current = new Map();
  }, []);

  const resetAcceptanceState = useCallback(() => {
    updateAcceptedStructuredItemMap({});
    updateAcceptingStructuredItemMap({});
    setIsAcceptingAll(false);
    acceptingStructuredItemRef.current.clear();
    acceptingAllRef.current = false;
  }, [updateAcceptedStructuredItemMap, updateAcceptingStructuredItemMap]);

  const getOpportunitySignatures = useCallback(async () => {
    if (opportunitySignaturesRef.current) {
      return opportunitySignaturesRef.current;
    }

    const items = await listOpportunities();
    const signatures = new Set(
      items
        .map((entry) => buildOpportunitySignature(entry))
        .filter(Boolean),
    );
    opportunitySignaturesRef.current = signatures;
    return signatures;
  }, []);

  const getContentSignatures = useCallback(async () => {
    if (contentSignaturesRef.current) {
      return contentSignaturesRef.current;
    }

    const items = await listContentItems();
    const signatures = new Set(
      items
        .map((entry) => buildContentSignature(entry))
        .filter(Boolean),
    );
    contentSignaturesRef.current = signatures;
    return signatures;
  }, []);

  const getWeeklyPrioritySignatures = useCallback(async (weekStart) => {
    if (weeklyPrioritySignaturesByWeekRef.current.has(weekStart)) {
      return weeklyPrioritySignaturesByWeekRef.current.get(weekStart);
    }

    const brief = await getWeeklyBriefByWeek(weekStart);
    const signatures = new Set(
      (Array.isArray(brief.priorities) ? brief.priorities : [])
        .map((entry) => buildPrioritySignature(entry))
        .filter(Boolean),
    );

    weeklyPrioritySignaturesByWeekRef.current.set(weekStart, signatures);
    return signatures;
  }, []);

  const setFeedbackIfAllowed = useCallback((message, suppressFeedback = false) => {
    if (!suppressFeedback && typeof setFeedback === 'function') {
      setFeedback(message);
    }
  }, [setFeedback]);

  const hydrateAcceptedStructuredItems = useCallback(async (workspaceResponses) => {
    const responseEntries = Array.isArray(workspaceResponses) ? workspaceResponses : [];
    if (!responseEntries.length) {
      updateAcceptedStructuredItemMap({});
      return;
    }

    try {
      const opportunitySignatures = await getOpportunitySignatures();
      const contentSignatures = await getContentSignatures();
      const weeklySignatures = await getWeeklyPrioritySignatures(getCurrentWeekStart());
      const accepted = {};

      responseEntries.forEach((entry) => {
        const payload = entry?.structuredPayload;
        if (!payload || typeof payload !== 'object') {
          return;
        }

        const opportunities = payload.opportunities;
        if (Array.isArray(opportunities)) {
          opportunities.forEach((item) => {
            const key = createStructuredItemKey('opportunities', item);
            const signature = buildOpportunitySignature(item);
            if (key && signature && opportunitySignatures.has(signature)) {
              accepted[key] = true;
            }
          });
        }

        const contentItems = payload.contentItems;
        if (Array.isArray(contentItems)) {
          contentItems.forEach((item) => {
            const key = createStructuredItemKey('contentItems', item);
            const signature = buildContentSignature(item);
            if (key && signature && contentSignatures.has(signature)) {
              accepted[key] = true;
            }
          });
        }

        const priorities = Array.isArray(payload.priorities) ? payload.priorities : [];
        priorities.forEach((item) => {
          const key = createStructuredItemKey('priorities', item);
          const signature = buildPrioritySignature(item);
          if (key && signature && weeklySignatures.has(signature)) {
            accepted[key] = true;
          }
        });

        const tasks = Array.isArray(payload.tasks) ? payload.tasks : [];
        tasks.forEach((item) => {
          const key = createStructuredItemKey('tasks', item);
          const signature = buildPrioritySignature(item);
          if (key && signature && weeklySignatures.has(signature)) {
            accepted[key] = true;
          }
        });
      });

      if (isMountedRef?.current === false) {
        return;
      }

      updateAcceptedStructuredItemMap(accepted);
    } catch {
      if (isMountedRef?.current === false) {
        return;
      }

      updateAcceptedStructuredItemMap({});
    }
  }, [
    getContentSignatures,
    getOpportunitySignatures,
    getWeeklyPrioritySignatures,
    isMountedRef,
    updateAcceptedStructuredItemMap,
  ]);

  const acceptStructuredItem = useCallback(async (section, item, options = {}) => {
    const { suppressFeedback = false } = options;
    const sectionKey = typeof section === 'string' ? section : '';
    const itemValue = item && typeof item === 'object' ? item : resolveStructuredText(item);
    const itemKey = createStructuredItemKey(sectionKey, itemValue);

    if (!itemKey) {
      setFeedbackIfAllowed('This item is missing required details and cannot be saved yet.', suppressFeedback);
      notifyTelemetry('accept_item_skipped', {
        section: sectionKey || 'unknown',
        reason: 'missing_required_details',
      });
      return ACCEPTANCE_STATUS.SKIPPED;
    }

    if (acceptedStructuredItemMapRef.current[itemKey]) {
      setFeedbackIfAllowed('This structured item was already added.', suppressFeedback);
      notifyTelemetry('accept_item_skipped', {
        section: sectionKey || 'unknown',
        reason: 'already_accepted',
      });
      return ACCEPTANCE_STATUS.SKIPPED;
    }

    if (acceptingStructuredItemMapRef.current[itemKey] || acceptingStructuredItemRef.current.has(itemKey)) {
      notifyTelemetry('accept_item_skipped', {
        section: sectionKey || 'unknown',
        reason: 'in_flight',
      });
      return ACCEPTANCE_STATUS.SKIPPED;
    }

    acceptingStructuredItemRef.current.add(itemKey);
    updateAcceptingStructuredItemMap((current) => ({
      ...current,
      [itemKey]: true,
    }));

    try {
      if (sectionKey === 'opportunities') {
        const name = resolveStructuredText(itemValue);
        if (!name) {
          setFeedbackIfAllowed('This opportunity entry is missing a name.', suppressFeedback);
          notifyTelemetry('accept_item_skipped', {
            section: sectionKey,
            reason: 'missing_name',
          });
          return ACCEPTANCE_STATUS.SKIPPED;
        }

        const signature = buildOpportunitySignature({
          name,
          company: itemValue.company || '',
        });
        const existingSignatures = await getOpportunitySignatures();
        if (signature && existingSignatures.has(signature)) {
          updateAcceptedStructuredItemMap((current) => ({
            ...current,
            [itemKey]: true,
          }));
          setFeedbackIfAllowed('That opportunity already exists.', suppressFeedback);
          notifyTelemetry('accept_item_skipped', {
            section: sectionKey,
            reason: 'already_exists',
          });
          return ACCEPTANCE_STATUS.SKIPPED;
        }

        await createOpportunity({
          name,
          company: itemValue.company || '',
          priority: itemValue.priority || 'Medium',
          stage: itemValue.stage || 'New',
          nextStep: itemValue.nextStep || itemValue.next_step || '',
        });
        if (signature) {
          existingSignatures.add(signature);
        }
        updateAcceptedStructuredItemMap((current) => ({
          ...current,
          [itemKey]: true,
        }));
        setFeedbackIfAllowed('Added an opportunity from the structured AI output.', suppressFeedback);
        notifyTelemetry('accept_item_saved', { section: sectionKey });
        return ACCEPTANCE_STATUS.SAVED;
      }

      if (sectionKey === 'contentItems') {
        const title = resolveStructuredText(itemValue);
        if (!title) {
          setFeedbackIfAllowed('This content entry is missing a title.', suppressFeedback);
          notifyTelemetry('accept_item_skipped', {
            section: sectionKey,
            reason: 'missing_title',
          });
          return ACCEPTANCE_STATUS.SKIPPED;
        }

        const signature = buildContentSignature({
          title,
          platform: itemValue.platform || itemValue.channel || '',
        });
        const existingSignatures = await getContentSignatures();
        if (signature && existingSignatures.has(signature)) {
          updateAcceptedStructuredItemMap((current) => ({
            ...current,
            [itemKey]: true,
          }));
          setFeedbackIfAllowed('That content item already exists.', suppressFeedback);
          notifyTelemetry('accept_item_skipped', {
            section: sectionKey,
            reason: 'already_exists',
          });
          return ACCEPTANCE_STATUS.SKIPPED;
        }

        await createContentItem({
          title,
          platform: itemValue.platform || itemValue.channel || '',
          status: itemValue.status || 'Drafting',
        });
        if (signature) {
          existingSignatures.add(signature);
        }
        updateAcceptedStructuredItemMap((current) => ({
          ...current,
          [itemKey]: true,
        }));
        setFeedbackIfAllowed('Added a content item from the structured AI output.', suppressFeedback);
        notifyTelemetry('accept_item_saved', { section: sectionKey });
        return ACCEPTANCE_STATUS.SAVED;
      }

      if (sectionKey === 'priorities' || sectionKey === 'tasks') {
        const title = resolveStructuredText(itemValue);
        if (!title) {
          setFeedbackIfAllowed('This priority entry is missing a title.', suppressFeedback);
          notifyTelemetry('accept_item_skipped', {
            section: sectionKey,
            reason: 'missing_title',
          });
          return ACCEPTANCE_STATUS.SKIPPED;
        }

        const currentWeekStart = getCurrentWeekStart();
        const signature = buildPrioritySignature({ title });
        const existingSignatures = await getWeeklyPrioritySignatures(currentWeekStart);
        if (signature && existingSignatures.has(signature)) {
          updateAcceptedStructuredItemMap((current) => ({
            ...current,
            [itemKey]: true,
          }));
          setFeedbackIfAllowed('That weekly priority already exists.', suppressFeedback);
          notifyTelemetry('accept_item_skipped', {
            section: sectionKey,
            reason: 'already_exists',
          });
          return ACCEPTANCE_STATUS.SKIPPED;
        }

        await createWeeklyItem({
          weekStart: currentWeekStart,
          itemType: 'priority',
          item: {
            id: buildCreateId(),
            title,
            owner: itemValue.owner || 'Team Member',
            status: itemValue.status || 'Planned',
          },
        });
        if (signature) {
          existingSignatures.add(signature);
        }
        updateAcceptedStructuredItemMap((current) => ({
          ...current,
          [itemKey]: true,
        }));
        setFeedbackIfAllowed('Added a weekly priority from the structured AI output.', suppressFeedback);
        notifyTelemetry('accept_item_saved', { section: sectionKey });
        return ACCEPTANCE_STATUS.SAVED;
      }

      setFeedbackIfAllowed('This structured item type is not supported yet.', suppressFeedback);
      notifyTelemetry('accept_item_skipped', {
        section: sectionKey || 'unknown',
        reason: 'unsupported_section',
      });
      return ACCEPTANCE_STATUS.SKIPPED;
    } catch (error) {
      if (typeof setLoadError === 'function') {
        setLoadError('Unable to accept this structured AI item right now.');
      }
      setFeedbackIfAllowed('Unable to save this item right now. Try again.', suppressFeedback);
      if (import.meta.env.DEV) {
        console.error('Failed to accept structured AI item', error);
      }
      notifyTelemetry('accept_item_failed', {
        section: sectionKey || 'unknown',
      });
      return ACCEPTANCE_STATUS.FAILED;
    } finally {
      acceptingStructuredItemRef.current.delete(itemKey);
      if (isMountedRef?.current !== false) {
        updateAcceptingStructuredItemMap((current) => {
          if (!current[itemKey]) {
            return current;
          }

          const next = { ...current };
          delete next[itemKey];
          return next;
        });
      }
    }
  }, [
    getContentSignatures,
    getOpportunitySignatures,
    getWeeklyPrioritySignatures,
    isMountedRef,
    notifyTelemetry,
    setFeedbackIfAllowed,
    setLoadError,
    updateAcceptedStructuredItemMap,
    updateAcceptingStructuredItemMap,
  ]);

  const acceptAllStructured = useCallback(async (structuredPayload) => {
    const effectivePayload = structuredPayload && typeof structuredPayload === 'object'
      ? structuredPayload
      : responses[0]?.structuredPayload;

    if (!effectivePayload || typeof effectivePayload !== 'object') {
      if (typeof setFeedback === 'function') {
        setFeedback('No structured items are available to add.');
      }
      notifyTelemetry('accept_all_skipped', { reason: 'no_payload' });
      return false;
    }

    if (acceptingAllRef.current) {
      if (typeof setFeedback === 'function') {
        setFeedback('Add all is already running.');
      }
      notifyTelemetry('accept_all_skipped', { reason: 'already_running' });
      return false;
    }

    acceptingAllRef.current = true;
    setIsAcceptingAll(true);
    notifyTelemetry('accept_all_started');

    let saved = 0;
    let skipped = 0;
    let failed = 0;

    try {
      const queue = [
        ...(Array.isArray(effectivePayload.priorities)
          ? effectivePayload.priorities.map((item) => ({ section: 'priorities', item }))
          : []),
        ...(Array.isArray(effectivePayload.opportunities)
          ? effectivePayload.opportunities.map((item) => ({ section: 'opportunities', item }))
          : []),
        ...(Array.isArray(effectivePayload.contentItems)
          ? effectivePayload.contentItems.map((item) => ({ section: 'contentItems', item }))
          : []),
        ...(Array.isArray(effectivePayload.tasks)
          ? effectivePayload.tasks.map((item) => ({ section: 'tasks', item }))
          : []),
      ];

      if (!queue.length) {
        if (typeof setFeedback === 'function') {
          setFeedback('No valid structured items found to add.');
        }
        notifyTelemetry('accept_all_skipped', { reason: 'no_valid_items' });
        return false;
      }

      for (let index = 0; index < queue.length; index += 1) {
        const { section, item } = queue[index];
        const status = await acceptStructuredItem(section, item, { suppressFeedback: true });
        if (status === ACCEPTANCE_STATUS.SAVED) {
          saved += 1;
        } else if (status === ACCEPTANCE_STATUS.FAILED) {
          failed += 1;
        } else {
          skipped += 1;
        }
      }

      if (typeof setFeedback === 'function') {
        setFeedback(`Add all complete: ${saved} saved, ${skipped} skipped, ${failed} failed.`);
      }
      notifyTelemetry('accept_all_completed', {
        saved,
        skipped,
        failed,
      });
      return failed === 0;
    } finally {
      acceptingAllRef.current = false;
      if (isMountedRef?.current !== false) {
        setIsAcceptingAll(false);
      }
    }
  }, [acceptStructuredItem, isMountedRef, notifyTelemetry, responses, setFeedback]);

  const isStructuredItemAccepted = useCallback(
    (section, item) => {
      const itemKey = createStructuredItemKey(section, item);
      return itemKey ? Boolean(acceptedStructuredItemMap[itemKey]) : false;
    },
    [acceptedStructuredItemMap],
  );

  const isStructuredItemAccepting = useCallback(
    (section, item) => {
      const itemKey = createStructuredItemKey(section, item);
      return itemKey ? Boolean(acceptingStructuredItemMap[itemKey]) : false;
    },
    [acceptingStructuredItemMap],
  );

  return {
    isAcceptingAll,
    acceptStructuredItem,
    acceptAllStructured,
    isStructuredItemAccepted,
    isStructuredItemAccepting,
    hydrateAcceptedStructuredItems,
    resetAcceptanceCaches,
    resetAcceptanceState,
  };
}
