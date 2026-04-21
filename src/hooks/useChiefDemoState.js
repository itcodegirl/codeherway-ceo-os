import { useCallback, useMemo, useRef, useState } from "react";
import { chiefMockResponse } from "../data/chiefMockResponse";
import { normalizeChiefOutput } from "../lib/normalizeChiefOutput";
import {
  createOpportunity,
  listOpportunities
} from "../lib/opportunitiesRepository";
import { createContentItem, listContentItems } from "../lib/contentRepository";
import {
  createWeeklyItem,
  getCurrentWeekStart,
  getWeeklyBriefByWeek
} from "../lib/weeklyRepository";
import { buildCreateId } from "../lib/utils";

const ACCEPTANCE_STATUS = {
  SAVED: "saved",
  SKIPPED: "skipped",
  FAILED: "failed"
};

function normalizeComparableValue(value) {
  return String(value || "").trim().toLowerCase();
}

function normalizeText(value, fallback = "") {
  const normalized = String(value || "").trim();
  return normalized || fallback;
}

function buildOpportunitySignature(value) {
  const normalizedName = normalizeComparableValue(
    value?.name || value?.title || value?.text || value?.summary || value?.task
  );
  const normalizedCompany = normalizeComparableValue(
    value?.company || value?.organization
  );
  return normalizedName ? `${normalizedName}|${normalizedCompany}` : "";
}

function buildContentSignature(value) {
  const normalizedTitle = normalizeComparableValue(
    value?.title || value?.name || value?.text || value?.summary || value?.task
  );
  const normalizedPlatform = normalizeComparableValue(
    value?.platform || value?.channel
  );
  return normalizedTitle ? `${normalizedTitle}|${normalizedPlatform}` : "";
}

function buildPrioritySignature(value) {
  const normalizedTitle = normalizeComparableValue(
    value?.title || value?.name || value?.text || value?.summary || value?.task
  );
  return normalizedTitle;
}

function createStructuredItemKey(section, item) {
  const sectionKey = normalizeComparableValue(section);
  const itemValue = item && typeof item === "object" ? item : {};

  if (sectionKey === "opportunities") {
    const signature = buildOpportunitySignature(itemValue);
    return signature ? `${sectionKey}:${signature}` : "";
  }

  if (sectionKey === "contentitems") {
    const signature = buildContentSignature(itemValue);
    return signature ? `${sectionKey}:${signature}` : "";
  }

  if (sectionKey === "priorities" || sectionKey === "tasks") {
    const normalizedTitle = normalizeComparableValue(itemValue.title);
    const normalizedOwner = normalizeComparableValue(itemValue.owner);
    return normalizedTitle ? `${sectionKey}:${normalizedTitle}|${normalizedOwner}` : "";
  }

  return "";
}

function normalizeOpportunityPayload(item) {
  if (!item || typeof item !== "object") {
    return null;
  }

  const name = normalizeText(
    item.name || item.title || item.text || item.summary || item.task
  );
  if (!name) {
    return null;
  }

  return {
    name,
    company: normalizeText(item.company || item.organization),
    priority: normalizeText(item.priority, "Medium"),
    stage: normalizeText(item.stage, "New"),
    nextStep: normalizeText(item.nextStep || item.next_step)
  };
}

function normalizeContentPayload(item) {
  if (!item || typeof item !== "object") {
    return null;
  }

  const title = normalizeText(
    item.title || item.name || item.text || item.summary || item.task
  );
  if (!title) {
    return null;
  }

  return {
    title,
    platform: normalizeText(item.platform || item.channel, "LinkedIn"),
    status: normalizeText(item.status, "Drafting")
  };
}

function normalizeWeeklyPayload(item) {
  if (!item || typeof item !== "object") {
    return null;
  }

  const title = normalizeText(
    item.title || item.name || item.text || item.summary || item.task
  );
  if (!title) {
    return null;
  }

  return {
    title,
    owner: normalizeText(item.owner, "Team Member"),
    status: normalizeText(item.status, "Planned")
  };
}

const DEFAULT_FEEDBACK =
  "Paste notes and build an action plan, then save selected items into your system.";

export function useChiefDemoState() {
  const [notes, setNotes] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState(null);
  const [feedback, setFeedback] = useState(DEFAULT_FEEDBACK);
  const [acceptedItemMap, setAcceptedItemMap] = useState({});
  const [acceptingItemMap, setAcceptingItemMap] = useState({});
  const [isAcceptingAll, setIsAcceptingAll] = useState(false);
  const acceptingItemRef = useRef(new Set());
  const acceptingAllRef = useRef(false);
  const opportunitySignaturesRef = useRef(null);
  const contentSignaturesRef = useRef(null);
  const weeklyPrioritySignaturesByWeekRef = useRef(new Map());

  const normalizedResult = useMemo(() => {
    return result ? normalizeChiefOutput(result) : null;
  }, [result]);

  const setFeedbackIfAllowed = useCallback((message, suppressFeedback = false) => {
    if (!suppressFeedback) {
      setFeedback(message);
    }
  }, []);

  const getOpportunitySignatures = useCallback(async () => {
    if (opportunitySignaturesRef.current) {
      return opportunitySignaturesRef.current;
    }

    const opportunities = await listOpportunities();
    const signatures = new Set(
      opportunities
        .map((entry) => buildOpportunitySignature(entry))
        .filter(Boolean)
    );
    opportunitySignaturesRef.current = signatures;
    return signatures;
  }, []);

  const getContentSignatures = useCallback(async () => {
    if (contentSignaturesRef.current) {
      return contentSignaturesRef.current;
    }

    const contentItems = await listContentItems();
    const signatures = new Set(
      contentItems.map((entry) => buildContentSignature(entry)).filter(Boolean)
    );
    contentSignaturesRef.current = signatures;
    return signatures;
  }, []);

  const getWeeklyPrioritySignatures = useCallback(async (weekStart) => {
    if (weeklyPrioritySignaturesByWeekRef.current.has(weekStart)) {
      return weeklyPrioritySignaturesByWeekRef.current.get(weekStart);
    }

    const weeklyBrief = await getWeeklyBriefByWeek(weekStart);
    const signatures = new Set(
      (Array.isArray(weeklyBrief.priorities) ? weeklyBrief.priorities : [])
        .map((entry) => buildPrioritySignature(entry))
        .filter(Boolean)
    );

    weeklyPrioritySignaturesByWeekRef.current.set(weekStart, signatures);
    return signatures;
  }, []);

  const setItemAccepting = useCallback((itemKey, nextValue) => {
    setAcceptingItemMap((current) => {
      if (nextValue) {
        return {
          ...current,
          [itemKey]: true
        };
      }

      if (!current[itemKey]) {
        return current;
      }

      const next = { ...current };
      delete next[itemKey];
      return next;
    });
  }, []);

  const markItemAccepted = useCallback((itemKey) => {
    setAcceptedItemMap((current) => ({
      ...current,
      [itemKey]: true
    }));
  }, []);

  const withAcceptingGuard = useCallback(
    async (itemKey, fn) => {
      if (!itemKey) {
        return ACCEPTANCE_STATUS.SKIPPED;
      }

      if (acceptedItemMap[itemKey]) {
        return ACCEPTANCE_STATUS.SKIPPED;
      }

      if (acceptingItemMap[itemKey] || acceptingItemRef.current.has(itemKey)) {
        return ACCEPTANCE_STATUS.SKIPPED;
      }

      acceptingItemRef.current.add(itemKey);
      setItemAccepting(itemKey, true);

      try {
        return await fn();
      } finally {
        acceptingItemRef.current.delete(itemKey);
        setItemAccepting(itemKey, false);
      }
    },
    [acceptedItemMap, acceptingItemMap, setItemAccepting]
  );

  const acceptOpportunity = useCallback(
    async (item, options = {}) => {
      const { suppressFeedback = false } = options;
      const normalizedPayload = normalizeOpportunityPayload(item);
      const itemKey = createStructuredItemKey("opportunities", normalizedPayload);

      if (!normalizedPayload || !itemKey) {
        setFeedbackIfAllowed(
          "Skipped malformed opportunity. Missing required details.",
          suppressFeedback
        );
        return ACCEPTANCE_STATUS.SKIPPED;
      }

      try {
        return await withAcceptingGuard(itemKey, async () => {
          const signature = buildOpportunitySignature(normalizedPayload);
          const existingSignatures = await getOpportunitySignatures();

          if (signature && existingSignatures.has(signature)) {
            markItemAccepted(itemKey);
            setFeedbackIfAllowed(
              "Skipped existing opportunity. Already in your system.",
              suppressFeedback
            );
            return ACCEPTANCE_STATUS.SKIPPED;
          }

          await createOpportunity(normalizedPayload);
          if (signature) {
            existingSignatures.add(signature);
          }

          markItemAccepted(itemKey);
          setFeedbackIfAllowed("Saved opportunity to your system.", suppressFeedback);
          return ACCEPTANCE_STATUS.SAVED;
        });
      } catch {
        setFeedbackIfAllowed("Failed to save opportunity.", suppressFeedback);
        return ACCEPTANCE_STATUS.FAILED;
      }
    },
    [
      getOpportunitySignatures,
      markItemAccepted,
      setFeedbackIfAllowed,
      withAcceptingGuard
    ]
  );

  const acceptContent = useCallback(
    async (item, options = {}) => {
      const { suppressFeedback = false } = options;
      const normalizedPayload = normalizeContentPayload(item);
      const itemKey = createStructuredItemKey("contentItems", normalizedPayload);

      if (!normalizedPayload || !itemKey) {
        setFeedbackIfAllowed(
          "Skipped malformed content item. Missing required details.",
          suppressFeedback
        );
        return ACCEPTANCE_STATUS.SKIPPED;
      }

      try {
        return await withAcceptingGuard(itemKey, async () => {
          const signature = buildContentSignature(normalizedPayload);
          const existingSignatures = await getContentSignatures();

          if (signature && existingSignatures.has(signature)) {
            markItemAccepted(itemKey);
            setFeedbackIfAllowed(
              "Skipped existing content item. Already in your system.",
              suppressFeedback
            );
            return ACCEPTANCE_STATUS.SKIPPED;
          }

          await createContentItem(normalizedPayload);
          if (signature) {
            existingSignatures.add(signature);
          }

          markItemAccepted(itemKey);
          setFeedbackIfAllowed("Saved content item to your system.", suppressFeedback);
          return ACCEPTANCE_STATUS.SAVED;
        });
      } catch {
        setFeedbackIfAllowed("Failed to save content item.", suppressFeedback);
        return ACCEPTANCE_STATUS.FAILED;
      }
    },
    [getContentSignatures, markItemAccepted, setFeedbackIfAllowed, withAcceptingGuard]
  );

  const acceptWeeklyPriorityItem = useCallback(
    async (item, section, options = {}) => {
      const { suppressFeedback = false } = options;
      const normalizedPayload = normalizeWeeklyPayload(item);
      const itemKey = createStructuredItemKey(section, normalizedPayload);

      if (!normalizedPayload || !itemKey) {
        setFeedbackIfAllowed(
          "Skipped malformed weekly item. Missing required details.",
          suppressFeedback
        );
        return ACCEPTANCE_STATUS.SKIPPED;
      }

      try {
        return await withAcceptingGuard(itemKey, async () => {
          const weekStart = getCurrentWeekStart();
          const signature = buildPrioritySignature(normalizedPayload);
          const existingSignatures = await getWeeklyPrioritySignatures(weekStart);

          if (signature && existingSignatures.has(signature)) {
            markItemAccepted(itemKey);
            setFeedbackIfAllowed(
              "Skipped existing weekly item. Already in this week.",
              suppressFeedback
            );
            return ACCEPTANCE_STATUS.SKIPPED;
          }

          await createWeeklyItem({
            weekStart,
            itemType: "priority",
            item: {
              id: buildCreateId(),
              title: normalizedPayload.title,
              owner: normalizedPayload.owner,
              status: normalizedPayload.status
            }
          });

          if (signature) {
            existingSignatures.add(signature);
          }

          markItemAccepted(itemKey);
          setFeedbackIfAllowed("Saved item to Weekly.", suppressFeedback);
          return ACCEPTANCE_STATUS.SAVED;
        });
      } catch {
        setFeedbackIfAllowed("Failed to save weekly item.", suppressFeedback);
        return ACCEPTANCE_STATUS.FAILED;
      }
    },
    [
      getWeeklyPrioritySignatures,
      markItemAccepted,
      setFeedbackIfAllowed,
      withAcceptingGuard
    ]
  );

  const acceptPriority = useCallback(
    async (item, options = {}) => {
      return acceptWeeklyPriorityItem(item, "priorities", options);
    },
    [acceptWeeklyPriorityItem]
  );

  const acceptTask = useCallback(
    async (item, options = {}) => {
      return acceptWeeklyPriorityItem(item, "tasks", options);
    },
    [acceptWeeklyPriorityItem]
  );

  const acceptAll = useCallback(async () => {
    if (!normalizedResult?.structured) {
      setFeedback("No action plan items to add yet.");
      return false;
    }

    if (acceptingAllRef.current) {
      setFeedback("Add all is already running.");
      return false;
    }

    acceptingAllRef.current = true;
    setIsAcceptingAll(true);

    let saved = 0;
    let skipped = 0;
    let failed = 0;

    try {
      const structured = normalizedResult.structured;
      const queue = [
        ...(Array.isArray(structured.priorities)
          ? structured.priorities.map((item) => ({
              accept: acceptPriority,
              item
            }))
          : []),
        ...(Array.isArray(structured.opportunities)
          ? structured.opportunities.map((item) => ({
              accept: acceptOpportunity,
              item
            }))
          : []),
        ...(Array.isArray(structured.contentItems)
          ? structured.contentItems.map((item) => ({
              accept: acceptContent,
              item
            }))
          : []),
        ...(Array.isArray(structured.tasks)
          ? structured.tasks.map((item) => ({
              accept: acceptTask,
              item
            }))
          : [])
      ];

      if (!queue.length) {
        setFeedback("No valid items found to add.");
        return false;
      }

      for (const entry of queue) {
        const status = await entry.accept(entry.item, {
          suppressFeedback: true
        });

        if (status === ACCEPTANCE_STATUS.SAVED) {
          saved += 1;
        } else if (status === ACCEPTANCE_STATUS.FAILED) {
          failed += 1;
        } else {
          skipped += 1;
        }
      }

      setFeedback(
        `Add all complete: ${saved} saved, ${skipped} skipped, ${failed} failed.`
      );
      return failed === 0;
    } finally {
      acceptingAllRef.current = false;
      setIsAcceptingAll(false);
    }
  }, [
    acceptContent,
    acceptOpportunity,
    acceptPriority,
    acceptTask,
    normalizedResult
  ]);

  const isOpportunityAccepted = useCallback(
    (item) => {
      const itemKey = createStructuredItemKey(
        "opportunities",
        normalizeOpportunityPayload(item)
      );
      return itemKey ? Boolean(acceptedItemMap[itemKey]) : false;
    },
    [acceptedItemMap]
  );

  const isOpportunityAccepting = useCallback(
    (item) => {
      const itemKey = createStructuredItemKey(
        "opportunities",
        normalizeOpportunityPayload(item)
      );
      return itemKey ? Boolean(acceptingItemMap[itemKey]) : false;
    },
    [acceptingItemMap]
  );

  const isContentAccepted = useCallback(
    (item) => {
      const itemKey = createStructuredItemKey(
        "contentItems",
        normalizeContentPayload(item)
      );
      return itemKey ? Boolean(acceptedItemMap[itemKey]) : false;
    },
    [acceptedItemMap]
  );

  const isContentAccepting = useCallback(
    (item) => {
      const itemKey = createStructuredItemKey(
        "contentItems",
        normalizeContentPayload(item)
      );
      return itemKey ? Boolean(acceptingItemMap[itemKey]) : false;
    },
    [acceptingItemMap]
  );

  const isPriorityAccepted = useCallback(
    (item) => {
      const itemKey = createStructuredItemKey(
        "priorities",
        normalizeWeeklyPayload(item)
      );
      return itemKey ? Boolean(acceptedItemMap[itemKey]) : false;
    },
    [acceptedItemMap]
  );

  const isPriorityAccepting = useCallback(
    (item) => {
      const itemKey = createStructuredItemKey(
        "priorities",
        normalizeWeeklyPayload(item)
      );
      return itemKey ? Boolean(acceptingItemMap[itemKey]) : false;
    },
    [acceptingItemMap]
  );

  const isTaskAccepted = useCallback(
    (item) => {
      const itemKey = createStructuredItemKey("tasks", normalizeWeeklyPayload(item));
      return itemKey ? Boolean(acceptedItemMap[itemKey]) : false;
    },
    [acceptedItemMap]
  );

  const isTaskAccepting = useCallback(
    (item) => {
      const itemKey = createStructuredItemKey("tasks", normalizeWeeklyPayload(item));
      return itemKey ? Boolean(acceptingItemMap[itemKey]) : false;
    },
    [acceptingItemMap]
  );

  async function handleBuildActionPlan() {
    if (!notes.trim()) return;

    setIsGenerating(true);
    setFeedback("Building your action plan...");

    await new Promise((resolve) => setTimeout(resolve, 1200));

    setResult(chiefMockResponse);
    setIsGenerating(false);
    setIsAcceptingAll(false);
    acceptingAllRef.current = false;
    setAcceptedItemMap({});
    setAcceptingItemMap({});
    acceptingItemRef.current.clear();
    opportunitySignaturesRef.current = null;
    contentSignaturesRef.current = null;
    weeklyPrioritySignaturesByWeekRef.current = new Map();
    setFeedback("Action plan ready. Add selected items to your system.");
  }

  function resetWorkspace() {
    setNotes("");
    setResult(null);
    setIsGenerating(false);
    setIsAcceptingAll(false);
    acceptingAllRef.current = false;
    setAcceptedItemMap({});
    setAcceptingItemMap({});
    acceptingItemRef.current.clear();
    opportunitySignaturesRef.current = null;
    contentSignaturesRef.current = null;
    weeklyPrioritySignaturesByWeekRef.current = new Map();
    setFeedback(DEFAULT_FEEDBACK);
  }

  return {
    notes,
    setNotes,
    isGenerating,
    isAcceptingAll,
    feedback,
    result: normalizedResult,
    handleBuildActionPlan,
    resetWorkspace,
    acceptPriority,
    acceptOpportunity,
    acceptContent,
    acceptTask,
    acceptAll,
    isPriorityAccepted,
    isPriorityAccepting,
    isOpportunityAccepted,
    isOpportunityAccepting,
    isContentAccepted,
    isContentAccepting,
    isTaskAccepted,
    isTaskAccepting
  };
}
