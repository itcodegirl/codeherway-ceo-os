import { weeklyPriorities } from '../../data/mockData';

const statusDotClass = {
  'In Progress': 'weekly-list__dot--success',
  Planned: '',
  Blocked: 'weekly-list__dot--warning',
};

function WeeklyPriorities({ items = weeklyPriorities }) {
  return (
    <ul className="weekly-list">
      {items.map((item) => (
        <li key={item.id} className="weekly-list__item">
          <span className={`weekly-list__dot ${statusDotClass[item.status] || ''}`.trim()} aria-hidden="true" />
          <div>
            <p className="weekly-note">{item.title}</p>
            <p className="helper-text helper-text--offset">
              Owner: {item.owner} | Status: {item.status}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}

export default WeeklyPriorities;
