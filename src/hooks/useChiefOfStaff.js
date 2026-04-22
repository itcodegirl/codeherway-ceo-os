import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { aiConfig, generateChiefOfStaffResponse, getChiefActionTitle } from '../lib/openai';
import { createOpportunity, listOpportunities } from '../lib/opportunitiesRepository';
import { createContentItem, listContentItems } from '../lib/contentRepository';
import { createWeeklyItem, getCurrentWeekStart, getWeeklyBriefByWeek } from '../lib/weeklyRepository';
import { buildCreateId } from '../lib/utils';
import { emitChiefTelemetry } from '../lib/chiefTelemetry';
import {
  createChiefSession,
  getChiefSource,
  loadChiefWorkspace,
  resetChiefWorkspace,
  saveChiefNotes,
  saveChiefOutput,
} from '../lib/chiefRepository';

function getDefaultFeedback() {
  return aiConfig.hasProxyEndpoint
    ? 'Start by pasting notes. Then choose an action to transform them into executive-ready output.'
    : 'AI proxy is using the default endpoint. For production reliability, configure VITE_OPENAI_PROXY_URL and OPENAI_API_KEY.';
}

function resolveNotes(nextNotes) {
  return typeof nextNotes === 'string' ? nextNotes : '';
}

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

const ACCEPTANCE_STATUS = {
  SAVED: 'saved',
  SKIPPED: 'skipped',
  FAILED: 'failed',
};

export function useChiefOfStaff() {
  const [notes, setNotesState] = useState('');
  const [responses, setResponses] = useState([]);
  const [feedback, setFeedback] = useState(getDefaultFeedback);
  const [source, setSource] = useState(getChiefSource());
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [acceptedStructuredItemMap, setAcceptedStructuredItemMap] = useState({});
  const [acceptingStructuredItemMap, setAcceptingStructuredItemMap] = useState({});
  const [isAcceptingAll, setIsAcceptingAll] = useState(false);
  const isMountedRef = useRef(true);
  const acceptingStructuredItemRef = useRef(new Set());
  const acceptingAllRef = useRef(false);
  const opportunitySignaturesRef = useRef(null);
  const contentSignaturesRef = useRef(null);
  const weeklyPrioritySignaturesByWeekRef = useRef(new Map());

  const hasHistory = responses.length > 0;
  const notesText = resolveNotes(notes);
  const hasNotes = notesText.trim().length > 0;
  const canGenerate = hasNotes && !isGenerating;

  const trackTelemetry = useCallback((eventName, payload = {}) => {
    emitChiefTelemetry(eventName, payload);
  }, []);

  const resetAcceptanceCaches = useCallback(() => {
    opportunitySignaturesRef.current = null;
    contentSignaturesRef.current = null;
    weeklyPrioritySignaturesByWeekRef.current = new Map();
  }, []);

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

  const hydrateAcceptedStructuredItems = useCallback(async (workspaceResponses) => {
    const responseEntries = Array.isArray(workspaceResponses) ? workspaceResponses : [];
    if (!responseEntries.length) {
      setAcceptedStructuredItemMap({});
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
          if (!key || !signature) {
            return;
          }

          if (weeklySignatures.has(signature)) {
            accepted[key] = true;
          }
        });

        const tasks = Array.isArray(payload.tasks) ? payload.tasks : [];
        tasks.forEach((item) => {
          const key = createStructuredItemKey('tasks', item);
          const signature = buildPrioritySignature(item);
          if (!key || !signature) {
            return;
          }

          if (weeklySignatures.has(signature)) {
            accepted[key] = true;
          }
        });
      });

      if (!isMountedRef.current) {
        return;
      }

      setAcceptedStructuredItemMap(accepted);
    } catch {
      // Do not block workspace load if acceptance hydration fails.
      if (!isMountedRef.current) {
        return;
      }

      setAcceptedStructuredItemMap({});
    }
  }, [getContentSignatures, getOpportunitySignatures, getWeeklyPrioritySignatures]);

  const loadWorkspace = useCallback(async () => {
    setIsLoading(true);
    setLoadError('');

    try {
      const workspace = await loadChiefWorkspace();
      if (!isMountedRef.current) {
        return;
      }

      setNotesState(workspace.notes || '');
      const workspaceResponses = Array.isArray(workspace.responses) ? workspace.responses : [];
      setResponses(workspaceResponses);
      setSource(workspace.source || getChiefSource());
      setAcceptedStructuredItemMap({});
      setAcceptingStructuredItemMap({});
      setIsAcceptingAll(false);
      acceptingAllRef.current = false;
      resetAcceptanceCaches();
      void hydrateAcceptedStructuredItems(workspaceResponses);
    } catch (error) {
      if (!isMountedRef.current) {
        return;
      }

      setLoadError('Unable to load chief of staff workspace right now.');
      if (import.meta.env.DEV) {
        console.error('Failed to load chief workspace', error);
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [hydrateAcceptedStructuredItems, resetAcceptanceCaches]);

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      loadWorkspace();
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [loadWorkspace]);

  useEffect(
    () => () => {
      isMountedRef.current = false;
    },
    [],
  );

  useEffect(() => {
    if (!notesText || isGenerating) {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      setFeedback('Draft pipeline ready. Continue refining as needed.');
    }, 2500);

    return () => {
      window.clearTimeout(timer);
    };
  }, [isGenerating, notesText]);

  const setNotes = useCallback((nextNotes) => {
    const normalizedNotes = resolveNotes(nextNotes);
    setNotesState(normalizedNotes);
    void saveChiefNotes(normalizedNotes).catch((error) => {
      setLoadError('Unable to save notes right now.');
      if (import.meta.env.DEV) {
        console.error('Failed to persist chief notes', error);
      }
    });
  }, []);

  const appendPrompt = useCallback((value) => {
    const normalizedPrompt = resolveNotes(value).trim();
    if (!normalizedPrompt) {
      return;
    }

    setNotesState((existing) => {
      const normalizedExisting = resolveNotes(existing).trimEnd();
      const next = normalizedExisting ? `${normalizedExisting}\n\n${normalizedPrompt}` : normalizedPrompt;
      void saveChiefNotes(next).catch((error) => {
        setLoadError('Unable to save notes right now.');
        if (import.meta.env.DEV) {
          console.error('Failed to persist chief notes', error);
        }
      });
      return next;
    });
  }, []);

  const clearWorkspace = useCallback(async () => {
    try {
      await resetChiefWorkspace();
      if (!isMountedRef.current) {
        return;
      }

      setNotesState('');
      setResponses([]);
      setFeedback(getDefaultFeedback());
      setLoadError('');
      setAcceptedStructuredItemMap({});
      setAcceptingStructuredItemMap({});
      setIsAcceptingAll(false);
      acceptingStructuredItemRef.current.clear();
      acceptingAllRef.current = false;
      resetAcceptanceCaches();
    } catch (error) {
      if (!isMountedRef.current) {
        return;
      }

      setLoadError('Unable to clear workspace right now.');
      if (import.meta.env.DEV) {
        console.error('Failed to clear chief workspace', error);
      }
    }
  }, [resetAcceptanceCaches]);

  const handleAction = useCallback(async (actionKey) => {
    if (!canGenerate) {
      if (!hasNotes) {
        setFeedback('Paste notes first so we can produce a relevant draft or recommendation.');
        trackTelemetry('generate_blocked_no_notes', { actionKey });
      }
      return;
    }

    setIsGenerating(true);
    setFeedback('Generating a new draft for your current notes.');
    setLoadError('');
    const correlationId = buildCreateId();
    trackTelemetry('generate_started', {
      actionKey,
      notesLength: notesText.length,
      correlationId,
    });

    try {
      const session = await createChiefSession({
        actionKey,
        notes: notesText,
      });

      const nextResponse = await generateChiefOfStaffResponse({
        actionKey,
        notes: notesText,
        correlationId,
      });

      if (!isMountedRef.current) {
        return;
      }

      if (!nextResponse.content) {
        setFeedback('No output generated. Add more context and try again.');
        trackTelemetry('generate_completed_empty', {
          actionKey,
          source: nextResponse.source || 'unknown',
          correlationId: nextResponse.correlationId || correlationId,
          requestId: nextResponse.requestId || '',
        });
        return;
      }

      const savedOutput = await saveChiefOutput({
        sessionId: session.id,
        outputType: 'response',
        title: nextResponse.title || getChiefActionTitle(actionKey),
        content: nextResponse.content,
        structuredPayload: nextResponse.structuredPayload || {},
        source: nextResponse.source || 'proxy',
      });

      if (!isMountedRef.current) {
        return;
      }

      setResponses((current) => [savedOutput, ...current]);
      if (nextResponse.source === 'proxy') {
        setFeedback(`Created: ${savedOutput.title}. Review and edit before sending.`);
      } else {
        setFeedback(`Created: ${savedOutput.title}. Using local fallback output.`);
      }

      trackTelemetry('generate_completed', {
        actionKey,
        source: nextResponse.source || 'unknown',
        correlationId: nextResponse.correlationId || correlationId,
        requestId: nextResponse.requestId || '',
        structuredCounts: {
          priorities: Array.isArray(nextResponse.structuredPayload?.priorities)
            ? nextResponse.structuredPayload.priorities.length
            : 0,
          opportunities: Array.isArray(nextResponse.structuredPayload?.opportunities)
            ? nextResponse.structuredPayload.opportunities.length
            : 0,
          contentItems: Array.isArray(nextResponse.structuredPayload?.contentItems)
            ? nextResponse.structuredPayload.contentItems.length
            : 0,
          tasks: Array.isArray(nextResponse.structuredPayload?.tasks)
            ? nextResponse.structuredPayload.tasks.length
            : 0,
        },
      });
    } catch (error) {
      if (!isMountedRef.current) {
        return;
      }

      setFeedback('Unable to generate output right now. Try again in a moment.');
      setLoadError('Unable to generate chief output right now.');
      if (import.meta.env.DEV) {
        console.error('Chief workflow action failed', error);
      }
      trackTelemetry('generate_failed', {
        actionKey,
        correlationId,
      });
    } finally {
      if (isMountedRef.current) {
        setIsGenerating(false);
      }
    }
  }, [canGenerate, hasNotes, notesText, trackTelemetry]);

  const setFeedbackIfAllowed = useCallback((message, suppressFeedback = false) => {
    if (!suppressFeedback) {
      setFeedback(message);
    }
  }, []);

  const acceptStructuredItem = useCallback(async (section, item, options = {}) => {
    const { suppressFeedback = false } = options;
    const sectionKey = typeof section === 'string' ? section : '';
    const itemValue = item && typeof item === 'object' ? item : resolveStructuredText(item);
    const itemKey = createStructuredItemKey(sectionKey, itemValue);

    if (!itemKey) {
      setFeedbackIfAllowed('This item is missing required details and cannot be saved yet.', suppressFeedback);
      trackTelemetry('accept_item_skipped', {
        section: sectionKey || 'unknown',
        reason: 'missing_required_details',
      });
      return ACCEPTANCE_STATUS.SKIPPED;
    }

    if (acceptedStructuredItemMap[itemKey]) {
      setFeedbackIfAllowed('This structured item was already added.', suppressFeedback);
      trackTelemetry('accept_item_skipped', {
        section: sectionKey || 'unknown',
        reason: 'already_accepted',
      });
      return ACCEPTANCE_STATUS.SKIPPED;
    }

    if (acceptingStructuredItemMap[itemKey] || acceptingStructuredItemRef.current.has(itemKey)) {
      trackTelemetry('accept_item_skipped', {
        section: sectionKey || 'unknown',
        reason: 'in_flight',
      });
      return ACCEPTANCE_STATUS.SKIPPED;
    }

    acceptingStructuredItemRef.current.add(itemKey);
    setAcceptingStructuredItemMap((current) => ({
      ...current,
      [itemKey]: true,
    }));

    try {
      if (sectionKey === 'opportunities') {
        const name = resolveStructuredText(itemValue);
        if (!name) {
          setFeedbackIfAllowed('This opportunity entry is missing a name.', suppressFeedback);
          trackTelemetry('accept_item_skipped', {
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
          setAcceptedStructuredItemMap((current) => ({
            ...current,
            [itemKey]: true,
          }));
          setFeedbackIfAllowed('That opportunity already exists.', suppressFeedback);
          trackTelemetry('accept_item_skipped', {
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
        setAcceptedStructuredItemMap((current) => ({
          ...current,
          [itemKey]: true,
        }));
        setFeedbackIfAllowed('Added an opportunity from the structured AI output.', suppressFeedback);
        trackTelemetry('accept_item_saved', { section: sectionKey });
        return ACCEPTANCE_STATUS.SAVED;
      }

      if (sectionKey === 'contentItems') {
        const title = resolveStructuredText(itemValue);
        if (!title) {
          setFeedbackIfAllowed('This content entry is missing a title.', suppressFeedback);
          trackTelemetry('accept_item_skipped', {
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
          setAcceptedStructuredItemMap((current) => ({
            ...current,
            [itemKey]: true,
          }));
          setFeedbackIfAllowed('That content item already exists.', suppressFeedback);
          trackTelemetry('accept_item_skipped', {
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
        setAcceptedStructuredItemMap((current) => ({
          ...current,
          [itemKey]: true,
        }));
        setFeedbackIfAllowed('Added a content item from the structured AI output.', suppressFeedback);
        trackTelemetry('accept_item_saved', { section: sectionKey });
        return ACCEPTANCE_STATUS.SAVED;
      }

      if (sectionKey === 'priorities' || sectionKey === 'tasks') {
        const title = resolveStructuredText(itemValue);
        if (!title) {
          setFeedbackIfAllowed('This priority entry is missing a title.', suppressFeedback);
          trackTelemetry('accept_item_skipped', {
            section: sectionKey,
            reason: 'missing_title',
          });
          return ACCEPTANCE_STATUS.SKIPPED;
        }

        const currentWeekStart = getCurrentWeekStart();
        const signature = buildPrioritySignature({ title });
        const existingSignatures = await getWeeklyPrioritySignatures(currentWeekStart);
        if (signature && existingSignatures.has(signature)) {
          setAcceptedStructuredItemMap((current) => ({
            ...current,
            [itemKey]: true,
          }));
          setFeedbackIfAllowed('That weekly priority already exists.', suppressFeedback);
          trackTelemetry('accept_item_skipped', {
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
        setAcceptedStructuredItemMap((current) => ({
          ...current,
          [itemKey]: true,
        }));
        setFeedbackIfAllowed('Added a weekly priority from the structured AI output.', suppressFeedback);
        trackTelemetry('accept_item_saved', { section: sectionKey });
        return ACCEPTANCE_STATUS.SAVED;
      }

      setFeedbackIfAllowed('This structured item type is not supported yet.', suppressFeedback);
      trackTelemetry('accept_item_skipped', {
        section: sectionKey || 'unknown',
        reason: 'unsupported_section',
      });
      return ACCEPTANCE_STATUS.SKIPPED;
    } catch (error) {
      setLoadError('Unable to accept this structured AI item right now.');
      setFeedbackIfAllowed('Unable to save this item right now. Try again.', suppressFeedback);
      if (import.meta.env.DEV) {
        console.error('Failed to accept structured AI item', error);
      }
      trackTelemetry('accept_item_failed', {
        section: sectionKey || 'unknown',
      });
      return ACCEPTANCE_STATUS.FAILED;
    } finally {
      acceptingStructuredItemRef.current.delete(itemKey);
      setAcceptingStructuredItemMap((current) => {
        if (!current[itemKey]) {
          return current;
        }

        const next = { ...current };
        delete next[itemKey];
        return next;
      });
    }
  }, [
    acceptedStructuredItemMap,
    acceptingStructuredItemMap,
    getContentSignatures,
    getOpportunitySignatures,
    getWeeklyPrioritySignatures,
    setFeedbackIfAllowed,
    trackTelemetry,
  ]);

  const acceptAllStructured = useCallback(async (structuredPayload) => {
    const effectivePayload = structuredPayload && typeof structuredPayload === 'object'
      ? structuredPayload
      : responses[0]?.structuredPayload;

    if (!effectivePayload || typeof effectivePayload !== 'object') {
      setFeedback('No structured items are available to add.');
      trackTelemetry('accept_all_skipped', { reason: 'no_payload' });
      return false;
    }

    if (acceptingAllRef.current) {
      setFeedback('Add all is already running.');
      trackTelemetry('accept_all_skipped', { reason: 'already_running' });
      return false;
    }

    acceptingAllRef.current = true;
    setIsAcceptingAll(true);
    trackTelemetry('accept_all_started');

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
        setFeedback('No valid structured items found to add.');
        trackTelemetry('accept_all_skipped', { reason: 'no_valid_items' });
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

      setFeedback(`Add all complete: ${saved} saved, ${skipped} skipped, ${failed} failed.`);
      trackTelemetry('accept_all_completed', {
        saved,
        skipped,
        failed,
      });
      return failed === 0;
    } finally {
      acceptingAllRef.current = false;
      setIsAcceptingAll(false);
    }
  }, [acceptStructuredItem, responses, trackTelemetry]);

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

  return useMemo(
    () => ({
      notes: notesText,
      responses,
      feedback,
      source,
      isLoading,
      isGenerating,
      loadError,
      hasHistory,
      canGenerate,
      setNotes,
      appendPrompt,
      handleAction,
      acceptStructuredItem,
      acceptAllStructured,
      isAcceptingAll,
      isStructuredItemAccepted,
      isStructuredItemAccepting,
      clearWorkspace,
      refreshWorkspace: loadWorkspace,
    }),
    [
      notesText,
      responses,
      feedback,
      source,
      isLoading,
      isGenerating,
      loadError,
      hasHistory,
      canGenerate,
      setNotes,
      appendPrompt,
      handleAction,
      acceptStructuredItem,
      acceptAllStructured,
      isAcceptingAll,
      isStructuredItemAccepted,
      isStructuredItemAccepting,
      clearWorkspace,
      loadWorkspace,
    ],
  );
}
