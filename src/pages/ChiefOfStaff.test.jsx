import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import ChiefOfStaff from "./ChiefOfStaff";

describe("src/pages/ChiefOfStaff", () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders an empty state before generation", () => {
    render(
      <MemoryRouter>
        <ChiefOfStaff />
      </MemoryRouter>
    );

    const buildButton = screen.getByRole("button", { name: "Build Action Plan" });
    const notesField = screen.getByPlaceholderText(
      "I need to follow up with XPAIRK, write a LinkedIn post, and figure out hiring strategy..."
    );

    expect(buildButton).toBeDisabled();
    expect(notesField).toHaveValue("");
    expect(screen.getByText("No action plan yet")).toBeInTheDocument();
  });

  it("shows loading state then structured output after build", async () => {
    render(
      <MemoryRouter>
        <ChiefOfStaff />
      </MemoryRouter>
    );

    fireEvent.change(
      screen.getByPlaceholderText(
        "I need to follow up with XPAIRK, write a LinkedIn post, and figure out hiring strategy..."
      ),
      {
        target: { value: "Follow up with XPAIRK and define hiring strategy" }
      }
    );

    fireEvent.click(screen.getByRole("button", { name: "Build Action Plan" }));

    expect(screen.getByText("Building your action plan…")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("Executive Action Plan")).toBeInTheDocument();
    }, { timeout: 3000 });

    expect(screen.getByText("Priorities")).toBeInTheDocument();
    expect(screen.getByText("Opportunities")).toBeInTheDocument();
    expect(screen.getByText("Content Ideas")).toBeInTheDocument();
    expect(screen.getByText("Tasks")).toBeInTheDocument();
  });

  it("resets workspace and clears generated output", async () => {
    render(
      <MemoryRouter>
        <ChiefOfStaff />
      </MemoryRouter>
    );

    const notesField = screen.getByPlaceholderText(
      "I need to follow up with XPAIRK, write a LinkedIn post, and figure out hiring strategy..."
    );

    fireEvent.change(notesField, {
      target: { value: "Some founder notes" }
    });

    fireEvent.click(screen.getByRole("button", { name: "Build Action Plan" }));

    await waitFor(() => {
      expect(screen.getByText("Executive Action Plan")).toBeInTheDocument();
    }, { timeout: 3000 });

    fireEvent.click(screen.getByRole("button", { name: "Reset Workspace" }));

    expect(notesField).toHaveValue("");
    expect(screen.getByText("No action plan yet")).toBeInTheDocument();
  });
});
