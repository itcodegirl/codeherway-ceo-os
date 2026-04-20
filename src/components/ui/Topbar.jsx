function Topbar() {
  const now = new Date();
  const today = now.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
  const isoDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
    now.getDate(),
  ).padStart(2, '0')}`;

  return (
    <header className="topbar">
      <div className="topbar__left">
        <p className="topbar__label">Executive Overview</p>
        <h2 className="topbar__title">Welcome back, Jenna</h2>
      </div>

      <div className="topbar__right">
        <time className="topbar__meta" dateTime={isoDate}>
          {today}
        </time>
        <span className="topbar__status" aria-label="Current period set to this week">
          This Week
        </span>
        <span className="topbar__status">Live Preview</span>
      </div>
    </header>
  );
}

export default Topbar;
