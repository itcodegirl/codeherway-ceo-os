export default function OutputLoadingState() {
  return (
    <div className="chief-card chief-loading-state">
      <p className="chief-eyebrow">AI Output</p>
      <h3>Building your action plan…</h3>
      <ul className="chief-loading-steps">
        <li>Analyzing notes</li>
        <li>Extracting priorities</li>
        <li>Mapping opportunities</li>
        <li>Suggesting content ideas</li>
      </ul>
    </div>
  );
}
