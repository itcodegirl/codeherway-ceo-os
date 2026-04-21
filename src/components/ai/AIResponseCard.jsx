import Icon from '../ui/Icon';
import Button from '../ui/Button';

const STRUCTURED_SECTIONS = [
  { key: 'priorities', label: 'Suggested Priorities' },
  { key: 'opportunities', label: 'Suggested Opportunities' },
  { key: 'contentItems', label: 'Suggested Content Items' },
  { key: 'tasks', label: 'Suggested Tasks' },
];

function getItemSummary(item) {
  if (typeof item === 'string') {
    return item.trim();
  }

  if (!item || typeof item !== 'object') {
    return '';
  }

  if (typeof item.title === 'string' && item.title.trim()) {
    return item.title.trim();
  }

  if (typeof item.name === 'string' && item.name.trim()) {
    return item.name.trim();
  }

  if (typeof item.text === 'string' && item.text.trim()) {
    return item.text.trim();
  }

  if (typeof item.summary === 'string' && item.summary.trim()) {
    return item.summary.trim();
  }

  if (typeof item.task === 'string' && item.task.trim()) {
    return item.task.trim();
  }

  return '';
}

function getSectionItems(structuredPayload, sectionKey) {
  if (!structuredPayload || typeof structuredPayload !== 'object') {
    return [];
  }

  const values = structuredPayload[sectionKey];
  if (!Array.isArray(values)) {
    return [];
  }

  return values
    .map((item) => {
      if (typeof item === 'string') {
        const summary = getItemSummary(item);
        return summary ? { raw: item, summary } : null;
      }

      if (!item || typeof item !== 'object') {
        return null;
      }

      const summary = getItemSummary(item);
      return summary ? { raw: item, summary } : null;
    })
    .filter(Boolean);
}

function AIResponseCard({
  title,
  content,
  structuredPayload,
  onAcceptStructuredItem,
  isStructuredItemAccepted,
  isStructuredItemAccepting,
}) {
  if (!content) {
    return null;
  }

  return (
    <article className="section-card">
      <div className="section-card__header">
        <h3 className="section-card__title">
          <Icon name="section" size={16} className="section-card__title-icon" />
          <span>{title}</span>
        </h3>
      </div>
      <div className="section-card__body">
        <p className="chief-response__text">{content}</p>

        {STRUCTURED_SECTIONS.map((section) => {
          const items = getSectionItems(structuredPayload, section.key);
          if (!items.length) {
            return null;
          }

          return (
            <div key={section.key}>
              <p className="helper-text">{section.label}</p>
              <ul className="weekly-list">
                {items.map((item, index) => {
                  const isAccepting = Boolean(isStructuredItemAccepting?.(section.key, item.raw));
                  const isAccepted = Boolean(isStructuredItemAccepted?.(section.key, item.raw));
                  const actionLabel = isAccepting ? 'Adding...' : isAccepted ? 'Added' : 'Accept';

                  return (
                    <li key={`${section.key}-${index}`} className="weekly-list__item">
                      <span className="weekly-list__dot" aria-hidden="true" />
                      <div className="weekly-list__content">
                        <div className="weekly-list__details">
                          <p className="weekly-note">{item.summary}</p>
                        </div>
                        <div className="weekly-list__actions">
                          <Button
                            type="button"
                            size="small"
                            disabled={isAccepted || isAccepting}
                            onClick={() => onAcceptStructuredItem?.(section.key, item.raw)}
                            ariaLabel={`Accept ${section.label} item: ${item.summary}`}
                          >
                            {actionLabel}
                          </Button>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>
    </article>
  );
}

export default AIResponseCard;
