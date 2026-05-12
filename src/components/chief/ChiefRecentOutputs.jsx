// Horizontal "Recent outputs" strip rendered above the active output
// panel. The chief repository already keeps the last ~30 generations
// (MAX_CHIEF_RESPONSES in src/lib/chiefRepository.js), but until this
// strip existed only `responses[0]` was visible — regenerating felt
// lossy because prior drafts disappeared from the UI even though they
// still lived in storage.
//
// The strip is intentionally restrained: small chips, a clear "Latest"
// pip on the most recent, and the source (AI / Local fallback) so the
// founder can tell at a glance which entries were AI vs. template
// without opening each one.

function sourceLabel(source) {
  return source === 'fallback' ? 'Local fallback' : 'AI generated';
}

function buildAriaLabel({ title, source, isActive, isLatest, position }) {
  const sourceText = sourceLabel(source);
  const positionText = isLatest ? 'latest' : `${position} back`;
  const state = isActive ? ', currently viewing' : '';
  return `Open ${sourceText.toLowerCase()} output "${title}" (${positionText})${state}`;
}

export default function ChiefRecentOutputs({
  responses = [],
  selectedId,
  onSelect,
}) {
  if (!Array.isArray(responses) || responses.length < 2) {
    // Single-output state is already covered by the output panel itself;
    // rendering a one-chip strip would be visual noise.
    return null;
  }

  const activeId = selectedId || responses[0]?.id;

  return (
    <nav className="chief-recent-outputs" aria-label="Recent Chief of Staff outputs">
      <p className="chief-recent-outputs__label">Recent outputs</p>
      <ul className="chief-recent-outputs__list" role="list">
        {responses.map((entry, index) => {
          if (!entry || typeof entry !== 'object') return null;
          const isLatest = index === 0;
          const isActive = entry.id === activeId;
          const title = (typeof entry.title === 'string' && entry.title.trim())
            || 'Executive Output';
          const source = entry.source === 'fallback' ? 'fallback' : 'proxy';

          return (
            <li key={entry.id || `recent-${index}`} className="chief-recent-outputs__item">
              <button
                type="button"
                className={`chief-recent-chip${isActive ? ' chief-recent-chip--active' : ''}`}
                onClick={() => onSelect?.(entry.id)}
                aria-pressed={isActive}
                aria-label={buildAriaLabel({
                  title,
                  source,
                  isActive,
                  isLatest,
                  position: index,
                })}
                title={`${sourceLabel(source)} · ${title}`}
              >
                <span className="chief-recent-chip__title">{title}</span>
                <span className="chief-recent-chip__meta">
                  {isLatest ? 'Latest' : `${index} back`}
                  {' · '}
                  {sourceLabel(source)}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
