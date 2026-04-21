export const chiefMockResponse = {
  title: "Executive Action Plan",
  summary:
    "You should prioritize the XPAIRK follow-up, define the hiring strategy direction, and draft a LinkedIn post tied to current momentum this week.",
  source: "local",
  structured: {
    priorities: [
      {
        title: "Follow up with XPAIRK partnership",
        owner: "Jenna",
        status: "Planned",
        reason:
          "This is the highest-leverage external opportunity mentioned in the notes."
      },
      {
        title: "Define hiring strategy direction",
        owner: "Jenna",
        status: "Planned",
        reason:
          "Hiring uncertainty is creating decision drag and needs clarity."
      }
    ],
    opportunities: [
      {
        name: "XPAIRK partnership expansion",
        company: "XPAIRK",
        priority: "High",
        stage: "In Progress",
        nextStep: "Send proposal follow-up and request next meeting"
      },
      {
        name: "Hiring pipeline strategy review",
        company: "Internal",
        priority: "Medium",
        stage: "New",
        nextStep: "Outline role needs and define candidate criteria"
      }
    ],
    contentItems: [
      {
        title: "LinkedIn post on partnership-building and growth",
        platform: "LinkedIn",
        status: "Drafting",
        summary:
          "A founder-facing post about building momentum through partnerships while shaping hiring strategy."
      }
    ],
    tasks: [
      {
        title: "Outline hiring criteria for the next role",
        type: "task",
        status: "Planned"
      },
      {
        title: "Review open partnership follow-ups",
        type: "task",
        status: "Planned"
      }
    ]
  }
};
