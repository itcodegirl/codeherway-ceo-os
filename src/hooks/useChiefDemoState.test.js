import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useChiefDemoState } from "./useChiefDemoState";

vi.mock("../lib/opportunitiesRepository", () => ({
  createOpportunity: vi.fn(),
  listOpportunities: vi.fn()
}));

vi.mock("../lib/contentRepository", () => ({
  createContentItem: vi.fn(),
  listContentItems: vi.fn()
}));

vi.mock("../lib/weeklyRepository", () => ({
  createWeeklyItem: vi.fn(),
  getCurrentWeekStart: vi.fn(() => "2026-04-20"),
  getWeeklyBriefByWeek: vi.fn(() => Promise.resolve({ priorities: [] }))
}));

import {
  createOpportunity,
  listOpportunities
} from "../lib/opportunitiesRepository";
import { createContentItem, listContentItems } from "../lib/contentRepository";
import {
  createWeeklyItem,
  getWeeklyBriefByWeek
} from "../lib/weeklyRepository";

async function buildActionPlan(result) {
  act(() => {
    result.current.setNotes("Founder notes");
  });

  let buildPromise;
  act(() => {
    buildPromise = result.current.handleBuildActionPlan();
  });

  await act(async () => {
    await vi.advanceTimersByTimeAsync(1200);
    await buildPromise;
  });
}

describe("useChiefDemoState acceptance wiring", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    listOpportunities.mockResolvedValue([]);
    listContentItems.mockResolvedValue([]);
    getWeeklyBriefByWeek.mockResolvedValue({ priorities: [] });
    createOpportunity.mockResolvedValue({ id: "opp-1" });
    createContentItem.mockResolvedValue({ id: "content-1" });
    createWeeklyItem.mockResolvedValue({ id: "weekly-1" });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("saves accepted opportunity to repository", async () => {
    const { result } = renderHook(() => useChiefDemoState());

    const item = {
      name: "Pipeline Expansion",
      company: "Acme",
      priority: "High",
      stage: "In Progress",
      nextStep: "Schedule next meeting"
    };

    await act(async () => {
      await result.current.acceptOpportunity(item);
    });

    expect(createOpportunity).toHaveBeenCalledWith({
      name: "Pipeline Expansion",
      company: "Acme",
      priority: "High",
      stage: "In Progress",
      nextStep: "Schedule next meeting"
    });
    expect(result.current.isOpportunityAccepted(item)).toBe(true);
    expect(result.current.feedback).toBe("Saved opportunity to your system.");
  });

  it("saves accepted content item to repository", async () => {
    const { result } = renderHook(() => useChiefDemoState());

    const item = {
      title: "Founder update thread",
      platform: "LinkedIn",
      status: "Drafting",
      summary: "Narrative about growth"
    };

    await act(async () => {
      await result.current.acceptContent(item);
    });

    expect(createContentItem).toHaveBeenCalledWith({
      title: "Founder update thread",
      platform: "LinkedIn",
      status: "Drafting"
    });
    expect(result.current.isContentAccepted(item)).toBe(true);
    expect(result.current.feedback).toBe("Saved content item to your system.");
  });

  it("saves accepted priority to weekly repository", async () => {
    const { result } = renderHook(() => useChiefDemoState());

    const item = {
      title: "Finalize hiring criteria",
      owner: "Jenna",
      status: "Planned"
    };

    await act(async () => {
      await result.current.acceptPriority(item);
    });

    expect(createWeeklyItem).toHaveBeenCalledWith(
      expect.objectContaining({
        weekStart: "2026-04-20",
        itemType: "priority",
        item: expect.objectContaining({
          title: "Finalize hiring criteria",
          owner: "Jenna",
          status: "Planned"
        })
      })
    );
    expect(result.current.isPriorityAccepted(item)).toBe(true);
    expect(result.current.feedback).toBe("Saved item to Weekly.");
  });

  it("saves accepted task to weekly repository", async () => {
    const { result } = renderHook(() => useChiefDemoState());

    const item = {
      title: "Review partner follow-ups",
      owner: "Jenna",
      status: "Planned"
    };

    await act(async () => {
      await result.current.acceptTask(item);
    });

    expect(createWeeklyItem).toHaveBeenCalledWith(
      expect.objectContaining({
        weekStart: "2026-04-20",
        itemType: "priority",
        item: expect.objectContaining({
          title: "Review partner follow-ups"
        })
      })
    );
    expect(result.current.isTaskAccepted(item)).toBe(true);
  });

  it("skips malformed opportunity items safely", async () => {
    const { result } = renderHook(() => useChiefDemoState());

    await act(async () => {
      await result.current.acceptOpportunity({ company: "Acme" });
    });

    expect(createOpportunity).not.toHaveBeenCalled();
    expect(result.current.feedback).toBe(
      "Skipped malformed opportunity. Missing required details."
    );
  });

  it("skips malformed weekly items safely", async () => {
    const { result } = renderHook(() => useChiefDemoState());

    await act(async () => {
      await result.current.acceptTask({ owner: "Jenna" });
    });

    expect(createWeeklyItem).not.toHaveBeenCalled();
    expect(result.current.feedback).toBe(
      "Skipped malformed weekly item. Missing required details."
    );
  });

  it("skips existing weekly priorities instead of saving duplicates", async () => {
    getWeeklyBriefByWeek.mockResolvedValue({
      priorities: [{ title: "Finalize hiring criteria" }]
    });

    const { result } = renderHook(() => useChiefDemoState());

    await act(async () => {
      await result.current.acceptPriority({ title: "Finalize hiring criteria" });
    });

    expect(createWeeklyItem).not.toHaveBeenCalled();
    expect(result.current.feedback).toBe(
      "Skipped existing weekly item. Already in this week."
    );
  });

  it("dedupes rapid repeated saves for the same opportunity", async () => {
    let resolveCreate;
    createOpportunity.mockReturnValue(
      new Promise((resolve) => {
        resolveCreate = resolve;
      })
    );

    const { result } = renderHook(() => useChiefDemoState());
    const item = {
      name: "Rapid Save",
      company: "Acme"
    };

    let firstPromise;
    let secondPromise;

    act(() => {
      firstPromise = result.current.acceptOpportunity(item);
      secondPromise = result.current.acceptOpportunity(item);
    });

    expect(result.current.isOpportunityAccepting(item)).toBe(true);

    await act(async () => {
      resolveCreate({ id: "opp-1" });
      await Promise.all([firstPromise, secondPromise]);
    });

    expect(createOpportunity).toHaveBeenCalledTimes(1);
    expect(result.current.isOpportunityAccepted(item)).toBe(true);
    expect(result.current.isOpportunityAccepting(item)).toBe(false);
  });

  it("processes accept-all with mixed valid and invalid items", async () => {
    vi.useFakeTimers();

    createContentItem.mockRejectedValueOnce(new Error("Failed content save"));

    const { result } = renderHook(() => useChiefDemoState());
    await buildActionPlan(result);

    act(() => {
      result.current.result.structured.opportunities.push({ company: "Malformed" });
    });

    await act(async () => {
      await result.current.acceptAll();
    });

    expect(createWeeklyItem).toHaveBeenCalledTimes(4);
    expect(createOpportunity).toHaveBeenCalledTimes(2);
    expect(createContentItem).toHaveBeenCalledTimes(1);
    expect(result.current.feedback).toBe(
      "Add all complete: 6 saved, 1 skipped, 1 failed."
    );
  });

  it("protects accept-all from rapid repeated clicks", async () => {
    vi.useFakeTimers();

    let resolveOpportunity;
    createOpportunity
      .mockReturnValueOnce(
        new Promise((resolve) => {
          resolveOpportunity = resolve;
        })
      )
      .mockResolvedValue({ id: "opp-2" });

    const { result } = renderHook(() => useChiefDemoState());
    await buildActionPlan(result);

    let firstPromise;
    let secondPromise;

    act(() => {
      firstPromise = result.current.acceptAll();
      secondPromise = result.current.acceptAll();
    });

    expect(result.current.isAcceptingAll).toBe(true);

    await act(async () => {
      resolveOpportunity({ id: "opp-1" });
      await Promise.all([firstPromise, secondPromise]);
    });

    expect(createWeeklyItem).toHaveBeenCalledTimes(4);
    expect(createOpportunity).toHaveBeenCalledTimes(2);
    expect(createContentItem).toHaveBeenCalledTimes(1);
  });
});
