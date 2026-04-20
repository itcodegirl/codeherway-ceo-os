function ActivityFeed({ items = [] }) {
  return (
    <div className="activity-feed">
      {items.length === 0 ? (
        <p className="helper-text">No activity yet. Add a note or mark a priority complete to begin the feed.</p>
      ) : (
        items.map((item) => (
          <article key={item.id} className="activity-item">
            <p className="activity-item__title">{item.title}</p>
            <p className="activity-item__meta">
              {item.time} • {item.type}
            </p>
          </article>
        ))
      )}
    </div>
  );
}

export default ActivityFeed;
