function resolveCellDataLabel(column) {
  if (!column || typeof column !== 'object') {
    return '';
  }

  if (typeof column.dataLabel === 'string' && column.dataLabel.trim()) {
    return column.dataLabel.trim();
  }

  return typeof column.label === 'string' ? column.label : '';
}

function resolveCellKey(column, fallbackIndex) {
  if (!column || typeof column !== 'object') {
    return `cell-${fallbackIndex}`;
  }

  if (typeof column.key === 'string' && column.key.trim()) {
    return column.key.trim();
  }

  const dataLabel = resolveCellDataLabel(column);
  return dataLabel ? dataLabel : `cell-${fallbackIndex}`;
}

export function CrudTableLoadingSkeleton({
  ariaLabel,
  loadingMessage,
  columns = [],
  rows = 3,
}) {
  const normalizedColumns = Array.isArray(columns) ? columns : [];
  const normalizedRows = Number.isFinite(rows) && rows > 0 ? Math.floor(rows) : 3;

  return (
    <div className="crm-table" role="table" aria-label={ariaLabel} aria-busy="true">
      <p className="sr-only" role="status" aria-live="polite">
        {loadingMessage}
      </p>
      <div className="crm-table__header" role="row">
        {normalizedColumns.map((column, index) => (
          <p key={resolveCellKey(column, index)} role="columnheader">
            {column?.label}
          </p>
        ))}
      </div>
      {Array.from({ length: normalizedRows }).map((_, rowIndex) => (
        <div key={rowIndex} className="crm-table__row" role="row">
          {normalizedColumns.map((column, columnIndex) => (
            <div
              key={resolveCellKey(column, columnIndex)}
              className="crm-table__cell"
              role="cell"
              data-label={resolveCellDataLabel(column)}
            >
              <div className="skeleton-line" />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

export function CrudCardGridLoadingSkeleton({
  className = 'content-board',
  ariaLabel,
  loadingMessage,
  cards = 3,
}) {
  const normalizedCards = Number.isFinite(cards) && cards > 0 ? Math.floor(cards) : 3;

  return (
    <div className={className} role="list" aria-label={ariaLabel} aria-busy="true">
      <p className="sr-only" role="status" aria-live="polite">
        {loadingMessage}
      </p>
      {Array.from({ length: normalizedCards }).map((_, index) => (
        <article className="content-card" key={index} role="listitem">
          <div className="content-card__header">
            <div>
              <div className="skeleton-line skeleton-line--value" />
              <div className="skeleton-line skeleton-line--offset" />
            </div>
            <div className="skeleton-line skeleton-line--meta-wide" />
          </div>
          <div className="content-card__footer">
            <div className="skeleton-line skeleton-line--meta-narrow" />
            <div className="skeleton-line skeleton-line--meta-narrow" />
          </div>
        </article>
      ))}
    </div>
  );
}
