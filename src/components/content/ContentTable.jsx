import { useCallback, useMemo } from 'react';
import Badge from '../ui/Badge';
import { contentStatusTone } from '../../lib/statusMaps';

function ContentTable({ items, onOpenItem }) {
  const isValidItemsArray = Array.isArray(items);
  const normalizedItems = useMemo(
    () => (isValidItemsArray ? items : []),
    [isValidItemsArray, items],
  );
  const hasHandler = typeof onOpenItem === 'function';

  const itemsById = useMemo(
    () =>
      new Map(normalizedItems.map((item) => [String(item.id), item])),
    [normalizedItems],
  );

  const activateRowFromEvent = useCallback((event) => {
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

    onOpenItem(item);
  }, [itemsById, onOpenItem]);

  const handleRowKeyDown = useCallback((event) => {
    if (!hasHandler) {
      return;
    }

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      activateRowFromEvent(event);
    }
  }, [activateRowFromEvent, hasHandler]);

  const handleRowClick = useCallback((event) => {
    if (!hasHandler) {
      return;
    }

    activateRowFromEvent(event);
  }, [activateRowFromEvent, hasHandler]);

  if (!isValidItemsArray) {
    return null;
  }

  return (
    <div className="crm-table">
      <table className="crm-table__native" aria-label="Content pipeline">
        <thead>
          <tr className="crm-table__header">
            <th scope="col">Title</th>
            <th scope="col">Platform</th>
            <th scope="col">Status</th>
          </tr>
        </thead>
        <tbody
          onClick={hasHandler ? handleRowClick : undefined}
          onKeyDown={hasHandler ? handleRowKeyDown : undefined}
        >
          {normalizedItems.map((item) => (
            <tr
              key={item.id}
              data-item-id={String(item.id)}
              className={hasHandler ? 'crm-table__row crm-table__row--interactive' : 'crm-table__row'}
              tabIndex={hasHandler ? 0 : undefined}
              aria-label={hasHandler ? `Open ${item.title} on ${item.platform}` : undefined}
            >
              <td className="crm-table__cell" data-label="Title">
                <p className="crm-table__title">{item.title}</p>
              </td>
              <td className="crm-table__cell" data-label="Platform">
                <p className="crm-table__subtitle">{item.platform}</p>
              </td>
              <td className="crm-table__cell" data-label="Status">
                <Badge label={item.status} tone={contentStatusTone[item.status] || 'default'} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default ContentTable;
