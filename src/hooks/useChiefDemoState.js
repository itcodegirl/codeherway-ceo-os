import { useMemo, useState } from "react";
import { chiefMockResponse } from "../data/chiefMockResponse";
import { normalizeChiefOutput } from "../lib/normalizeChiefOutput";

export function useChiefDemoState() {
  const [notes, setNotes] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState(null);

  const normalizedResult = useMemo(() => {
    return result ? normalizeChiefOutput(result) : null;
  }, [result]);

  async function handleBuildActionPlan() {
    if (!notes.trim()) return;

    setIsGenerating(true);

    await new Promise((resolve) => setTimeout(resolve, 1200));

    setResult(chiefMockResponse);
    setIsGenerating(false);
  }

  function resetWorkspace() {
    setNotes("");
    setResult(null);
    setIsGenerating(false);
  }

  return {
    notes,
    setNotes,
    isGenerating,
    result: normalizedResult,
    handleBuildActionPlan,
    resetWorkspace
  };
}
