import { opportunities as mockOpportunities } from '../../data/mockData';

function OpportunityTable({ items, onSelect }) {
  const rows = items && items.length ? items : mockOpportunities;

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
          onClick={() => onSelect?.(item)}
        >
          <p className="crm-table__title">{item.name}</p>
          <p className="crm-table__subtitle">{item.company}</p>
          <span className={`pill pill--${item.priority.toLowerCase()}`}>
            {item.priority}
          </span>
          <p className="crm-table__subtitle">
            <span className="pill pill--low">{item.stage}</span> {item.nextStep}
          </p>
        </button>
      ))}
    </div>
  );
}

export default OpportunityTable;
