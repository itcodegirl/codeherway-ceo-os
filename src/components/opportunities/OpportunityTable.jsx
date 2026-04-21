import { opportunities as mockOpportunities } from '../../data/mockData';
import Badge from '../ui/Badge';

const stageTone = {
  'In Progress': 'high',
  'Awaiting Reply': 'warning',
  New: 'low',
};

function OpportunityTable({ items, onSelect }) {
  const rows = Array.isArray(items) ? items : mockOpportunities;
  const hasHandler = typeof onSelect === 'function';

  return (
    <div className="crm-table" role="table" aria-label="Opportunity pipeline">
      <div className="crm-table__header" role="row">
        <p role="columnheader">Opportunity</p>
        <p role="columnheader">Company</p>
        <p role="columnheader">Priority</p>
        <p role="columnheader">Stage / Next Step</p>
      </div>

      {rows.map((item) => (
        <button
          key={item.id}
          type="button"
          className="crm-table__row crm-table__row--button"
          role="row"
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
            <Badge label={item.priority} tone={item.priority.toLowerCase()} />
          </span>
          <span className="crm-table__cell" role="cell" data-label="Stage / Next Step">
            <p className="crm-table__subtitle">
              <Badge label={item.stage} tone={stageTone[item.stage] || 'low'} /> {item.nextStep}
            </p>
          </span>
        </button>
      ))}
    </div>
  );
}

export default OpportunityTable;
