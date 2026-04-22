export const CHIEF_ACTIONS = {
  plan: {
    title: 'Executive Action Plan',
    instruction:
      'Return a concise founder action plan with structured sections for priorities, opportunities, content items, and tasks. Include practical next steps this week.',
    fallback: ({ notes }) =>
      `Executive Action Plan:\n- Priority: Clarify top execution lane for this week.\n- Opportunity: Follow up active partner or pipeline threads.\n- Content: Draft one founder-facing leadership update.\n- Task: Convert notes into owned actions.\n\nContext:\n${notes.slice(0, 280)}`,
  },
  summarize: {
    title: 'Executive Summary',
    instruction:
      'Write a concise executive summary with 3 short paragraphs: context, key updates, and immediate risks.',
    fallback: ({ notes }) =>
      `Executive Summary:\n${notes
        .split('.')
        .map((line) => line.trim())
        .filter(Boolean)
        .slice(0, 3)
        .map((line) => `- ${line}.`)
        .join('\n')}`,
  },
  draft: {
    title: 'Draft Starter',
    instruction:
      'Draft a polished LinkedIn post in the founder voice with a clear hook, insight, and call to action.',
    fallback: ({ notes }) =>
      `LinkedIn Draft Starter:\n- Hook: This week we moved from planning to execution.\n- Insight: ${notes.slice(0, 180) || 'Share one practical leadership lesson from the week.'}\n- CTA: What is one operating-system habit that keeps your team aligned?`,
  },
  actions: {
    title: 'Action Item List',
    instruction:
      'Return a prioritized action list for the next 72 hours. Include owner, outcome, and due timing for each item.',
    fallback: () =>
      'Action Items:\n- Owner: Team Member | Outcome: Confirm owner for each critical thread | Due: Today\n- Owner: Team Member | Outcome: Assign dates to each blocked item | Due: Tomorrow\n- Owner: Team | Outcome: Lock top 3 priorities for next 72 hours | Due: End of day',
  },
  priorities: {
    title: 'Priority Recommendation',
    instruction:
      'Recommend the top priorities for this week using impact, urgency, and sequence. Keep to 3 ranked bullets.',
    fallback: () =>
      'Priority Recommendation:\n1. Resolve high-urgency follow-ups with clear owners.\n2. Ship one high-leverage content artifact this week.\n3. Remove one strategic blocker that is slowing execution.',
  },
};

export function getChiefActionConfig(actionKey) {
  return CHIEF_ACTIONS[actionKey] || CHIEF_ACTIONS.summarize;
}
