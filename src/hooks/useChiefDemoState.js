import { useCallback, useMemo, useRef, useState } from "react";
import { chiefMockResponse } from "../data/chiefMockResponse";
import { normalizeChiefOutput } from "../lib/normalizeChiefOutput";
import {
  createOpportunity,
  listOpportunities
} from "../lib/opportunitiesRepository";
import { createContentItem, listContentItems } from "../lib/contentRepository";

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

const DEFAULT_FEEDBACK =
  "Paste notes and build an action plan, then save selected items into your system.";

export function useChiefDemoState() {
  const [notes, setNotes] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState(null);
  const [feedback, setFeedback] = useState(DEFAULT_FEEDBACK);
  const [acceptedItemMap, setAcceptedItemMap] = useState({});
  const [acceptingItemMap, setAcceptingItemMap] = useState({});
  const acceptingItemRef = useRef(new Set());
  const opportunitySignaturesRef = useRef(null);
  const contentSignaturesRef = useRef(null);

  const normalizedResult = useMemo(() => {
    return result ? normalizeChiefOutput(result) : null;
  }, [result]);

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
        return false;
      }

      if (acceptedItemMap[itemKey]) {
        return false;
      }

      if (acceptingItemMap[itemKey] || acceptingItemRef.current.has(itemKey)) {
        return false;
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
    async (item) => {
      const normalizedPayload = normalizeOpportunityPayload(item);
      const itemKey = createStructuredItemKey("opportunities", normalizedPayload);

      if (!normalizedPayload || !itemKey) {
        setFeedback("Skipped malformed opportunity. Missing required details.");
        return false;
      }

      return withAcceptingGuard(itemKey, async () => {
        const signature = buildOpportunitySignature(normalizedPayload);
        const existingSignatures = await getOpportunitySignatures();

        if (signature && existingSignatures.has(signature)) {
          markItemAccepted(itemKey);
          setFeedback("Skipped existing opportunity. Already in your system.");
          return false;
        }

        await createOpportunity(normalizedPayload);
        if (signature) {
          existingSignatures.add(signature);
        }

        markItemAccepted(itemKey);
        setFeedback("Saved opportunity to your system.");
        return true;
      });
    },
    [getOpportunitySignatures, markItemAccepted, withAcceptingGuard]
  );

  const acceptContent = useCallback(
    async (item) => {
      const normalizedPayload = normalizeContentPayload(item);
      const itemKey = createStructuredItemKey("contentItems", normalizedPayload);

      if (!normalizedPayload || !itemKey) {
        setFeedback("Skipped malformed content item. Missing required details.");
        return false;
      }

      return withAcceptingGuard(itemKey, async () => {
        const signature = buildContentSignature(normalizedPayload);
        const existingSignatures = await getContentSignatures();

        if (signature && existingSignatures.has(signature)) {
          markItemAccepted(itemKey);
          setFeedback("Skipped existing content item. Already in your system.");
          return false;
        }

        await createContentItem(normalizedPayload);
        if (signature) {
          existingSignatures.add(signature);
        }

        markItemAccepted(itemKey);
        setFeedback("Saved content item to your system.");
        return true;
      });
    },
    [getContentSignatures, markItemAccepted, withAcceptingGuard]
  );

  const acceptPriority = useCallback(async () => {
    setFeedback("Weekly acceptance wiring is coming in the next pass.");
    return false;
  }, []);

  const acceptTask = useCallback(async () => {
    setFeedback("Weekly acceptance wiring is coming in the next pass.");
    return false;
  }, []);

  const acceptAll = useCallback(async () => {
    setFeedback("Add-all wiring is coming in the next pass.");
    return false;
  }, []);

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

  async function handleBuildActionPlan() {
    if (!notes.trim()) return;

    setIsGenerating(true);
    setFeedback("Building your action plan...");

    await new Promise((resolve) => setTimeout(resolve, 1200));

    setResult(chiefMockResponse);
    setIsGenerating(false);
    setAcceptedItemMap({});
    setAcceptingItemMap({});
    acceptingItemRef.current.clear();
    opportunitySignaturesRef.current = null;
    contentSignaturesRef.current = null;
    setFeedback("Action plan ready. Add selected items to your system.");
  }

  function resetWorkspace() {
    setNotes("");
    setResult(null);
    setIsGenerating(false);
    setAcceptedItemMap({});
    setAcceptingItemMap({});
    acceptingItemRef.current.clear();
    opportunitySignaturesRef.current = null;
    contentSignaturesRef.current = null;
    setFeedback(DEFAULT_FEEDBACK);
  }

  return {
    notes,
    setNotes,
    isGenerating,
    feedback,
    result: normalizedResult,
    handleBuildActionPlan,
    resetWorkspace,
    acceptPriority,
    acceptOpportunity,
    acceptContent,
    acceptTask,
    acceptAll,
    isOpportunityAccepted,
    isOpportunityAccepting,
    isContentAccepted,
    isContentAccepting
  };
}
