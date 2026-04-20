import { opportunities as mockOpportunities } from '../../data/mockData';

function OpportunityTable({ items, onSelect }) {
  const rows = items && items.length ? items : mockOpportunities;
  const hasHandler = typeof onSelect === 'function';

  return (
    <div className="crm-table">
      <div className="crm-table__header">
        <p>Opportunity</p>
        <p>Company</p>
        <p>Priority</p>
        <p>Stage / Next Step</p>
      </div>

      {rows.map((item) => (
        <button
          key={item.id}
          type="button"
          className="crm-table__row crm-table__row--button"
          aria-label={
            hasHandler
              ? `Open ${item.name} opportunity from ${item.company}`
              : `No action available for ${item.name} opportunity from ${item.company}`
          }
          disabled={!hasHandler}
          onClick={() => onSelect?.(item)}
        >
          <span className="crm-table__cell" role="cell" data-label="Opportunity">
            <p className="crm-table__title crm-table__title--row">{item.name}</p>
          </span>
          <span className="crm-table__cell" role="cell" data-label="Company">
            <p className="crm-table__subtitle">{item.company}</p>
          </span>
          <span className="crm-table__cell" role="cell" data-label="Priority">
            <span className={`pill pill--${item.priority.toLowerCase()}`}>{item.priority}</span>
          </span>
          <span className="crm-table__cell" role="cell" data-label="Stage / Next Step">
            <p className="crm-table__subtitle">
              <span className="pill pill--low">{item.stage}</span> {item.nextStep}
            </p>
          </span>
        </button>
      ))}
    </div>
  );
}

export default OpportunityTable;
