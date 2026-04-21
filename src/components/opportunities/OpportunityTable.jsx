import Badge from '../ui/Badge';

const stageTone = {
  'In Progress': 'high',
  'Awaiting Reply': 'warning',
  New: 'low',
};

function OpportunityTable({ items, onSelect }) {
  if (!Array.isArray(items)) {
    return null;
  }

  const hasHandler = typeof onSelect === 'function';

  const handleRowKeyDown = (event, item) => {
    if (!hasHandler) {
      return;
    }

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onSelect(item);
    }
  };

  return (
    <div className="crm-table">
      <table className="crm-table__native" aria-label="Opportunity pipeline">
        <thead>
          <tr className="crm-table__header">
            <th scope="col">Opportunity</th>
            <th scope="col">Company</th>
            <th scope="col">Priority</th>
            <th scope="col">Stage / Next Step</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr
              key={item.id}
              className={hasHandler ? 'crm-table__row crm-table__row--interactive' : 'crm-table__row'}
              tabIndex={hasHandler ? 0 : undefined}
              onClick={hasHandler ? () => onSelect(item) : undefined}
              onKeyDown={(event) => handleRowKeyDown(event, item)}
              aria-label={
                hasHandler
                  ? `Open ${item.name} opportunity from ${item.company}`
                  : undefined
              }
            >
              <td className="crm-table__cell" data-label="Opportunity">
                <p className="crm-table__title crm-table__title--row">{item.name}</p>
              </td>
              <td className="crm-table__cell" data-label="Company">
                <p className="crm-table__subtitle">{item.company}</p>
              </td>
              <td className="crm-table__cell" data-label="Priority">
                <Badge label={item.priority} tone={item.priority.toLowerCase()} />
              </td>
              <td className="crm-table__cell" data-label="Stage / Next Step">
                <p className="crm-table__subtitle">
                  <Badge label={item.stage} tone={stageTone[item.stage] || 'low'} /> {item.nextStep}
                </p>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default OpportunityTable;
