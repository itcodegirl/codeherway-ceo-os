import { useCallback, useMemo } from 'react';
import Badge from '../ui/Badge';
import { opportunityStageTone } from '../../lib/statusMaps';

function OpportunityTable({ items, onSelect }) {
  const isValidItemsArray = Array.isArray(items);
  const normalizedItems = useMemo(
    () => (isValidItemsArray ? items : []),
    [isValidItemsArray, items],
  );
  const hasHandler = typeof onSelect === 'function';

  const itemsById = useMemo(
    () =>
      new Map(normalizedItems.map((item) => [String(item.id), item])),
    [normalizedItems],
  );

  const handleRowClick = useCallback((event) => {
    if (!hasHandler) {
      return;
    }

    const target = event.target;
    if (!(target instanceof Element)) {
      return;
    }

    const row = target.closest('tr[data-item-id]');
    if (!row) {
      return;
    }

    const itemId = row.getAttribute('data-item-id');
    if (!itemId) {
      return;
    }

    const item = itemsById.get(itemId);
    if (!item) {
      return;
    }

    onSelect(item);
  }, [hasHandler, itemsById, onSelect]);

  if (!isValidItemsArray) {
    return null;
  }

  return (
    <div className="crm-table">
      <table className="crm-table__native" aria-label="Opportunity pipeline">
        <thead>
          <tr className="crm-table__header">
            <th scope="col">Opportunity</th>
            <th scope="col">Company</th>
            <th scope="col">Priority</th>
            <th scope="col">Stage / Next Step</th>
            <th scope="col">Details</th>
          </tr>
        </thead>
        <tbody
          onClick={hasHandler ? handleRowClick : undefined}
        >
          {normalizedItems.map((item) => (
            <tr
              key={item.id}
              data-item-id={String(item.id)}
              className={hasHandler ? 'crm-table__row crm-table__row--interactive' : 'crm-table__row'}
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
                  <Badge label={item.stage} tone={opportunityStageTone[item.stage] || 'low'} /> {item.nextStep}
                </p>
              </td>
              <td className="crm-table__cell crm-table__cell--action" data-label="Details">
                {hasHandler ? (
                  <button type="button" className="crm-table__open-button">
                    Open
                    <span className="sr-only"> {item.name} opportunity from {item.company}</span>
                  </button>
                ) : null}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default OpportunityTable;
