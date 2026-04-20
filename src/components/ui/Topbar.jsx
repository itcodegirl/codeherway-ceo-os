function Topbar() {
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <header className="topbar">
      <div className="topbar__left">
        <p className="topbar__label">Executive Overview</p>
        <h2 className="topbar__title">Welcome back, Jenna</h2>
      </div>

      <div className="topbar__right">
        <p className="topbar__meta">{today}</p>
        <button type="button" className="topbar__action action-button">
          This Week
        </button>
        <span className="topbar__status">Live Preview</span>
      </div>
    </header>
  );
}

export default Topbar;
