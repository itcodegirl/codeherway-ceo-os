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
    loadError: "",
    isGenerating: false,
    isAcceptingAll: false,
    handleAction: vi.fn(),
    acceptStructuredItem: vi.fn(),
    acceptAllStructured: vi.fn(),
    isStructuredItemAccepted: vi.fn(() => false),
    isStructuredItemAccepting: vi.fn(() => false),
    clearWorkspace: vi.fn(),
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

    expect(screen.getByText("No action plan yet")).toBeInTheDocument();
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

    expect(screen.getByText("Building your action plan…")).toBeInTheDocument();
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

  it("reset button clears workspace", () => {
    const hookState = createHookState();
    useChiefOfStaff.mockReturnValue(hookState);

    render(
      <MemoryRouter>
        <ChiefOfStaff />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole("button", { name: "Reset Workspace" }));

    expect(hookState.clearWorkspace).toHaveBeenCalledTimes(1);
  });
});
