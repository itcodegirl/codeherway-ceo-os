import { weeklyPriorities } from '../../data/mockData';

function WeeklyPriorities() {
  return (
    <div className="weekly-grid">
      {weeklyPriorities.map((item) => (
        <article key={item.id} className="section-card">
          <div className="section-card__header">
            <h2>{item.title}</h2>
          </div>
          <div className="section-card__body">
            <p className="helper-text">Owner: {item.owner}</p>
            <p className="summary-card__label">Status: {item.status}</p>
          </div>
        </article>
      ))}
    </div>
  );
}

export default WeeklyPriorities;
