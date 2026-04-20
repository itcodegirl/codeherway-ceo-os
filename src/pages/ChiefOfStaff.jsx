function ChiefOfStaff() {
  const actions = [
    'Summarize this week',
    'Draft LinkedIn post',
    'Turn notes into action items',
    'Suggest next priorities',
  ];

  return (
    <section className="chief-page">
      <div className="page-intro">
        <h1>Chief of Staff</h1>
        <p>
          An AI-assisted workspace for executive summaries, planning prompts, and
          high-leverage drafting.
        </p>
      </div>

      <div className="chief-grid">
        <section className="section-card">
          <div className="section-card__header">
            <h2>Prompt Workspace</h2>
          </div>

          <div className="section-card__body">
            <textarea
              className="chief-textarea"
              placeholder="Paste notes, priorities, meeting takeaways, or rough ideas here..."
              rows="10"
            />

            <div className="chief-actions">
              {actions.map((action) => (
                <button key={action} className="chief-action-btn">
                  {action}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="section-card">
          <div className="section-card__header">
            <h2>AI Response</h2>
          </div>

          <div className="section-card__body">
            <div className="chief-response">
              <p className="chief-response__label">Draft Preview</p>
              <p className="chief-response__text">
                This week’s momentum is strong. Core product structure is in
                place, the dashboard experience is becoming more polished, and
                the next strategic move is to connect workflow pages with useful
                AI actions that support planning, content, and executive
                decision-making.
              </p>
            </div>

            <div className="chief-response">
              <p className="chief-response__label">Suggested Next Move</p>
              <p className="chief-response__text">
                Prioritize turning the Opportunities and Content OS views into
                editable systems, then connect this workspace to real AI actions
                through a secure backend.
              </p>
            </div>
          </div>
        </section>
      </div>
    </section>
  );
}

export default ChiefOfStaff;