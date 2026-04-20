import { contentItems } from '../../data/mockData';

function ContentTable({ onOpenItem }) {
  const hasHandler = typeof onOpenItem === 'function';

  return (
    <div className="crm-table" role="table" aria-label="Content pipeline">
      <div className="crm-table__header" role="row">
        <p role="columnheader">Title</p>
        <p role="columnheader">Platform</p>
        <p role="columnheader">Status</p>
      </div>

      {contentItems.map((item) => (
        <button
          key={item.id}
          type="button"
          className="crm-table__row crm-table__row--button"
          role="row"
          aria-label={hasHandler ? `Open ${item.title} on ${item.platform}` : `No action available for ${item.title} on ${item.platform}`}
          disabled={!hasHandler}
          onClick={() => onOpenItem?.(item)}
        >
          <span className="crm-table__cell" role="cell" data-label="Title">
            <p className="crm-table__title">{item.title}</p>
          </span>
          <span className="crm-table__cell" role="cell" data-label="Platform">
            <p className="crm-table__subtitle">{item.platform}</p>
          </span>
          <span className="crm-table__cell" role="cell" data-label="Status">
            <span className={`content-status content-status--${item.status.toLowerCase()}`}>
              {item.status}
            </span>
          </span>
        </button>
      ))}
    </div>
  );
}

export default ContentTable;
