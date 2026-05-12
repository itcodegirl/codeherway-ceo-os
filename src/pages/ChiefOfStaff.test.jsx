import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import ChiefOfStaff from "./ChiefOfStaff";

vi.mock("../hooks/useChiefOfStaff", () => ({
  useChiefOfStaff: vi.fn()
}));

import { useChiefOfStaff } from "../hooks/useChiefOfStaff";

function createHookState(overrides = {}) {
  return {
    notes: "",
    setNotes: vi.fn(),
    responses: [],
    feedback: "Ready",
    source: "local",
    isLoading: false,
    loadError: "",
    isGenerating: false,
    isAcceptingAll: false,
    handleAction: vi.fn(),
    acceptStructuredItem: vi.fn(),
    acceptAllStructured: vi.fn(),
    isStructuredItemAccepted: vi.fn(() => false),
    isStructuredItemAccepting: vi.fn(() => false),
    clearWorkspace: vi.fn(),
    refreshWorkspace: vi.fn(),
    ...overrides
  };
}

describe("src/pages/ChiefOfStaff", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders empty state when no response exists", () => {
    useChiefOfStaff.mockReturnValue(createHookState());

    render(
      <MemoryRouter>
        <ChiefOfStaff />
      </MemoryRouter>
    );

    expect(screen.getByText("Nothing here yet")).toBeInTheDocument();
    expect(
      screen.getByText(
        /When you generate, structured priorities, opportunities, content drafts/,
      ),
    ).toBeInTheDocument();
    // Audit follow-up: empty state now names all five actions so the user is
    // not pointed at a "choose an action" hint when the layout only renders
    // one button. Match a stable fragment to keep the test resilient to copy
    // tweaks on the action labels.
    expect(
      screen.getByText(/Paste founder notes in the workspace/),
    ).toBeInTheDocument();
    expect(screen.getByText("Chief workspace is stored on this device only.")).toBeInTheDocument();
    expect(screen.getByText("Add a few founder notes to generate an action plan.")).toBeInTheDocument();
  });

  it("renders all four secondary action chips alongside the primary Build Action Plan button", () => {
    useChiefOfStaff.mockReturnValue(createHookState({ notes: "Quick notes" }));

    render(
      <MemoryRouter>
        <ChiefOfStaff />
      </MemoryRouter>
    );

    // Audit follow-up: restored the four secondary action chips that match
    // the proxy's getAllowedActionKeys (plan, summarize, draft, actions,
    // priorities). The primary "Build Action Plan" is still the lead CTA.
    expect(screen.getByRole("button", { name: /Build Action Plan/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Summarize This Week/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Draft LinkedIn Post/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Convert to Action Items/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Suggest Next Priorities/ })).toBeInTheDocument();
  });

  it("renders loading output state when generating", () => {
    useChiefOfStaff.mockReturnValue(
      createHookState({
        notes: "Founder notes",
        isGenerating: true
      })
    );

    render(
      <MemoryRouter>
        <ChiefOfStaff />
      </MemoryRouter>
    );

    expect(screen.getByText("Working on your action plan…")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Building Action Plan..." })).toBeDisabled();
  });

  it("shows retryable workspace status and trust cue when loading fails", () => {
    const hookState = createHookState({
      loadError: "Unable to load chief of staff workspace right now.",
    });
    useChiefOfStaff.mockReturnValue(hookState);

    render(
      <MemoryRouter>
        <ChiefOfStaff />
      </MemoryRouter>
    );

    expect(screen.getByRole("alert")).toHaveTextContent("Unable to load chief of staff workspace right now.");
    fireEvent.click(screen.getByRole("button", { name: "Retry loading chief workspace" }));
    expect(hookState.refreshWorkspace).toHaveBeenCalledTimes(1);
    expect(screen.getByText("Review the workspace status above, then retry when ready.")).toBeInTheDocument();
  });

  it("renders structured output sections from latest response", () => {
    useChiefOfStaff.mockReturnValue(
      createHookState({
        responses: [
          {
            title: "Executive Action Plan",
            content: "High-leverage focus this week",
            source: "proxy",
            structuredPayload: {
              priorities: [{ title: "Priority A", owner: "Jenna", status: "Planned", reason: "High leverage" }],
              opportunities: [{ name: "Opp A", company: "Acme", priority: "High", stage: "New", nextStep: "Reach out" }],
              contentItems: [{ title: "Post A", platform: "LinkedIn", status: "Drafting", summary: "Draft this" }],
              tasks: [{ title: "Task A", type: "task", status: "Planned" }]
            }
          }
        ]
      })
    );

    render(
      <MemoryRouter>
        <ChiefOfStaff />
      </MemoryRouter>
    );

    expect(screen.getByText("Executive Action Plan")).toBeInTheDocument();
    expect(screen.getByText("Priorities")).toBeInTheDocument();
    expect(screen.getByText("Opportunities")).toBeInTheDocument();
    expect(screen.getByText("Content Ideas")).toBeInTheDocument();
    expect(screen.getByText("Tasks")).toBeInTheDocument();
    expect(screen.getByText(
      "Review before adding. Add all will add 1 priority to Weekly Brief, 1 opportunity to Opportunities, 1 content item to Content OS, and 1 task to Weekly Brief. Exact matches are skipped.",
    )).toBeInTheDocument();

    // Each section explains where accepting routes the item, and each item
    // shows its specific destination next to the accept button.
    expect(
      screen.getByText("Accepting creates a tracked record in your Opportunities pipeline."),
    ).toBeInTheDocument();
    expect(screen.getByText("→ Opportunities · New")).toBeInTheDocument();
    expect(screen.getByText("→ Content OS · Drafting")).toBeInTheDocument();
    expect(screen.getByText("→ Weekly Brief priority")).toBeInTheDocument();
    expect(screen.getByText("→ Weekly Brief task")).toBeInTheDocument();
  });

  it("labels fallback output and disables add all when no structured actions exist", () => {
    useChiefOfStaff.mockReturnValue(
      createHookState({
        responses: [
          {
            title: "Executive Action Plan",
            content: "Local fallback plan",
            source: "fallback",
            fallbackReason: "AI generation is unavailable; this is a local template fallback.",
            errorCode: "OPENAI_API_KEY_MISSING",
            errorMessage: "OPENAI_API_KEY is not configured on the server",
            structuredPayload: {
              priorities: [],
              opportunities: [],
              contentItems: [],
              tasks: []
            }
          }
        ]
      })
    );

    render(
      <MemoryRouter>
        <ChiefOfStaff />
      </MemoryRouter>
    );

    expect(screen.getByText("Local fallback")).toBeInTheDocument();
    expect(screen.getByText("AI generation is unavailable; this is a local template fallback.")).toBeInTheDocument();
    expect(screen.getByText("No structured actions were detected. Review the summary, or regenerate with more specific notes.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add All to System" })).toBeDisabled();
  });

  it("build button triggers plan action", () => {
    const hookState = createHookState({ notes: "Founder notes" });
    useChiefOfStaff.mockReturnValue(hookState);

    render(
      <MemoryRouter>
        <ChiefOfStaff />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole("button", { name: "Build Action Plan" }));

    expect(hookState.handleAction).toHaveBeenCalledWith("plan");
  });

  it("wires accept item handlers to structured sections", () => {
    const hookState = createHookState({
      responses: [
        {
          title: "Executive Action Plan",
          content: "Summary",
          source: "proxy",
          structuredPayload: {
            priorities: [{ title: "Priority A", owner: "Jenna", status: "Planned", reason: "High leverage" }],
            opportunities: [{ name: "Opp A", company: "Acme", priority: "High", stage: "New", nextStep: "Reach out" }],
            contentItems: [{ title: "Post A", platform: "LinkedIn", status: "Drafting", summary: "Draft this" }],
            tasks: [{ title: "Task A", type: "task", status: "Planned" }]
          }
        }
      ]
    });
    useChiefOfStaff.mockReturnValue(hookState);

    render(
      <MemoryRouter>
        <ChiefOfStaff />
      </MemoryRouter>
    );

    fireEvent.click(screen.getAllByRole("button", { name: "Add to Weekly" })[0]);
    fireEvent.click(screen.getByRole("button", { name: "Add to Opportunities" }));
    fireEvent.click(screen.getByRole("button", { name: "Add to Content" }));

    expect(hookState.acceptStructuredItem).toHaveBeenCalledWith("priorities", expect.any(Object));
    expect(hookState.acceptStructuredItem).toHaveBeenCalledWith("opportunities", expect.any(Object));
    expect(hookState.acceptStructuredItem).toHaveBeenCalledWith("contentItems", expect.any(Object));
  });

  it("wires add all button to acceptAllStructured", () => {
    const hookState = createHookState({
      responses: [
        {
          title: "Executive Action Plan",
          content: "Summary",
          source: "proxy",
          structuredPayload: {
            priorities: [{ title: "Priority A" }],
            opportunities: [],
            contentItems: [],
            tasks: []
          }
        }
      ]
    });
    useChiefOfStaff.mockReturnValue(hookState);

    render(
      <MemoryRouter>
        <ChiefOfStaff />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole("button", { name: "Add All to System" }));

    expect(hookState.acceptAllStructured).toHaveBeenCalledWith(expect.any(Object));
  });

  it("reset button confirms before clearing the workspace", () => {
    const hookState = createHookState();
    useChiefOfStaff.mockReturnValue(hookState);

    render(
      <MemoryRouter>
        <ChiefOfStaff />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole("button", { name: "Reset Workspace" }));
    // Opening the confirm dialog must not clear anything on its own.
    expect(hookState.clearWorkspace).not.toHaveBeenCalled();
    expect(
      screen.getByText(/This removes your saved notes and every generated output/),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Clear chief of staff workspace" }));
    expect(hookState.clearWorkspace).toHaveBeenCalledTimes(1);
  });

  it("renders recent outputs history and lets the user view an earlier one", () => {
    const hookState = createHookState({
      responses: [
        { id: "out-2", title: "Priority Recommendation", content: "Latest", source: "proxy", structuredPayload: {} },
        { id: "out-1", title: "Executive Summary", content: "Older summary text", source: "fallback", structuredPayload: {} },
      ],
    });
    useChiefOfStaff.mockReturnValue(hookState);

    render(
      <MemoryRouter>
        <ChiefOfStaff />
      </MemoryRouter>
    );

    expect(screen.getByText("Recent outputs")).toBeInTheDocument();
    // Latest is shown by default.
    expect(screen.queryByText(/You're viewing an earlier output/)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Executive Summary/ }));
    expect(screen.getByText(/You're viewing an earlier output/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Back to latest" }));
    expect(screen.queryByText(/You're viewing an earlier output/)).not.toBeInTheDocument();
  });

  it("shows notes character counter and max length on textarea", () => {
    const notes = "A".repeat(12000);
    useChiefOfStaff.mockReturnValue(createHookState({ notes }));

    render(
      <MemoryRouter>
        <ChiefOfStaff />
      </MemoryRouter>
    );

    const input = screen.getByLabelText("Founder notes for chief of staff workspace");

    expect(input).toHaveAttribute("maxLength", "12000");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByText("12,000 / 12,000 characters (limit reached)")).toBeInTheDocument();
    expect(screen.getByText("Notes reached the current limit. Trim them before generating a new action plan.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Build Action Plan" })).toBeDisabled();
  });
});
