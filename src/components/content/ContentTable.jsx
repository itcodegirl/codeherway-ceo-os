import { contentItems } from '../../data/mockData';

function ContentTable({ onOpenItem }) {
  return (
    <div className="crm-table">
      <div className="crm-table__header">
        <p>Title</p>
        <p>Platform</p>
        <p>Status</p>
      </div>

      {contentItems.map((item) => (
        <button
          key={item.id}
          type="button"
          className="crm-table__row crm-table__row--button"
          onClick={() => onOpenItem?.(item)}
        >
          <p className="crm-table__title">{item.title}</p>
          <p className="crm-table__subtitle">{item.platform}</p>
          <span className={`content-status content-status--${item.status.toLowerCase()}`}>
            {item.status}
          </span>
        </button>
      ))}
    </div>
  );
}

export default ContentTable;
