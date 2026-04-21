import { weeklyPriorities } from '../../data/mockData';
import Button from '../ui/Button';

const statusDotClass = {
  'In Progress': 'weekly-list__dot--success',
  Planned: '',
  Blocked: 'weekly-list__dot--warning',
};

function WeeklyPriorities({ items = weeklyPriorities, onEditItem, onDeleteItem }) {
  return (
    <ul className="weekly-list">
      {items.map((item) => (
        <li key={item.id} className="weekly-list__item">
          <span className={`weekly-list__dot ${statusDotClass[item.status] || ''}`.trim()} aria-hidden="true" />
          <div className="weekly-list__content">
            <div className="weekly-list__details">
              <p className="weekly-note">{item.title}</p>
              <p className="helper-text helper-text--offset">
                Owner: {item.owner} | Status: {item.status}
              </p>
            </div>
            <div className="weekly-list__actions">
              <Button
                type="button"
                size="small"
                variant="ghost"
                onClick={() => onEditItem?.(item)}
                disabled={!onEditItem}
                ariaLabel={`Edit priority ${item.title}`}
              >
                Edit
              </Button>
              <Button
                type="button"
                size="small"
                variant="ghost"
                onClick={() => onDeleteItem?.(item)}
                disabled={!onDeleteItem}
                ariaLabel={`Delete priority ${item.title}`}
              >
                Delete
              </Button>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

export default WeeklyPriorities;
