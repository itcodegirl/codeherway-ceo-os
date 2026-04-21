import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useChiefDemoState } from "./useChiefDemoState";

vi.mock("../lib/opportunitiesRepository", () => ({
  createOpportunity: vi.fn(),
  listOpportunities: vi.fn()
}));

vi.mock("../lib/contentRepository", () => ({
  createContentItem: vi.fn(),
  listContentItems: vi.fn()
}));

import {
  createOpportunity,
  listOpportunities
} from "../lib/opportunitiesRepository";
import { createContentItem, listContentItems } from "../lib/contentRepository";

describe("useChiefDemoState acceptance wiring", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    listOpportunities.mockResolvedValue([]);
    listContentItems.mockResolvedValue([]);
    createOpportunity.mockResolvedValue({ id: "opp-1" });
    createContentItem.mockResolvedValue({ id: "content-1" });
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
});
