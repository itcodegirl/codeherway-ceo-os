import Badge from '../ui/Badge';
import { contentStatusTone } from '../../lib/statusMaps';

function ContentTable({ items, onOpenItem }) {
  const hasHandler = typeof onOpenItem === 'function';
  if (!Array.isArray(items)) {
    return null;
  }

  const handleRowKeyDown = (event, item) => {
    if (!hasHandler) {
      return;
    }

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onOpenItem(item);
    }
  };

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
        <tbody>
          {items.map((item) => (
            <tr
              key={item.id}
              className={hasHandler ? 'crm-table__row crm-table__row--interactive' : 'crm-table__row'}
              tabIndex={hasHandler ? 0 : undefined}
              onClick={hasHandler ? () => onOpenItem(item) : undefined}
              onKeyDown={(event) => handleRowKeyDown(event, item)}
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
