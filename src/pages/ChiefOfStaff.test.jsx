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

    // The accessible name now describes the per-item downstream effect
    // (e.g. `Add priority "Priority A" to this week's Weekly Brief`). Match
    // the section keyword + title fragment instead of the bare ready label
    // so the test stays resilient as the destination copy evolves.
    fireEvent.click(screen.getByRole("button", { name: /Add priority "Priority A"/ }));
    fireEvent.click(screen.getByRole("button", { name: /Add opportunity "Opp A"/ }));
    fireEvent.click(screen.getByRole("button", { name: /Add content draft "Post A"/ }));

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
    // The destructive action waits for confirmation — nothing cleared yet.
    expect(hookState.clearWorkspace).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Reset the Chief of Staff workspace" }));
    expect(hookState.clearWorkspace).toHaveBeenCalledTimes(1);
  });

  it("renders the Recent outputs strip when more than one response exists, and clicking a chip swaps the active output", () => {
    const hookState = createHookState({
      responses: [
        {
          id: "out-newest",
          title: "Latest plan",
          content: "Latest content",
          source: "proxy",
          structuredPayload: {
            priorities: [{ title: "Priority Newest", owner: "Jenna", status: "Planned", reason: "Latest" }],
            opportunities: [],
            contentItems: [],
            tasks: [],
          },
        },
        {
          id: "out-older",
          title: "Older plan",
          content: "Older content",
          source: "proxy",
          structuredPayload: {
            priorities: [{ title: "Priority Older", owner: "Jenna", status: "Planned", reason: "Older" }],
            opportunities: [],
            contentItems: [],
            tasks: [],
          },
        },
      ],
    });
    useChiefOfStaff.mockReturnValue(hookState);

    render(
      <MemoryRouter>
        <ChiefOfStaff />
      </MemoryRouter>
    );

    // The strip appears with a Latest chip and an N-back chip.
    expect(screen.getByRole("navigation", { name: "Recent Chief of Staff outputs" })).toBeInTheDocument();
    expect(screen.getByText(/Latest · AI generated/)).toBeInTheDocument();
    expect(screen.getByText(/1 back · AI generated/)).toBeInTheDocument();

    // The freshest output is shown by default. The chip and the summary card
    // both contain "Latest plan" so match on the role-h2 heading to be
    // precise about which surface we are checking.
    expect(screen.getByRole("heading", { level: 2, name: "Latest plan" })).toBeInTheDocument();
    expect(screen.getByText("Priority Newest")).toBeInTheDocument();
    expect(screen.queryByText("Priority Older")).not.toBeInTheDocument();

    // Click the older chip — the panel swaps to that output.
    fireEvent.click(screen.getByRole("button", { name: /Open ai generated output "Older plan"/i }));
    expect(screen.getByRole("heading", { level: 2, name: "Older plan" })).toBeInTheDocument();
    expect(screen.getByText("Priority Older")).toBeInTheDocument();
  });

  it("does not render the Recent outputs strip when there is only one output", () => {
    useChiefOfStaff.mockReturnValue(
      createHookState({
        responses: [
          {
            id: "out-only",
            title: "Only plan",
            content: "Just one",
            source: "proxy",
            structuredPayload: {
              priorities: [{ title: "Priority A" }],
              opportunities: [],
              contentItems: [],
              tasks: [],
            },
          },
        ],
      })
    );

    render(
      <MemoryRouter>
        <ChiefOfStaff />
      </MemoryRouter>
    );

    expect(screen.queryByRole("navigation", { name: "Recent Chief of Staff outputs" })).not.toBeInTheDocument();
  });

  it("cancelling the reset confirmation leaves the workspace untouched", () => {
    const hookState = createHookState();
    useChiefOfStaff.mockReturnValue(hookState);

    render(
      <MemoryRouter>
        <ChiefOfStaff />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole("button", { name: "Reset Workspace" }));
    fireEvent.click(screen.getByRole("button", { name: "Keep the Chief of Staff workspace" }));

    expect(hookState.clearWorkspace).not.toHaveBeenCalled();
    expect(screen.queryByText("Reset Chief workspace?")).not.toBeInTheDocument();
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
