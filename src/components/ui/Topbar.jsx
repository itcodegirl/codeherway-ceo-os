import Icon from './Icon';

function Topbar() {
  const today = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
  const isoDate = new Date().toISOString().slice(0, 10);

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
        <button
          type="button"
          className="topbar__action action-button"
          aria-label="Current period filter is disabled in this version"
          disabled
        >
          This Week
          <Icon name="weekly" size={14} className="action-button__icon" />
        </button>
        <span className="topbar__status">Live Preview</span>
      </div>
    </header>
  );
}

export default Topbar;
