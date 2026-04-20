function Topbar() {
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <header className="topbar">
      <div>
        <p className="topbar__label">Executive Overview</p>
        <h2 className="topbar__title">Welcome back, Jenna</h2>
      </div>

      <div className="topbar__meta">
        <span>{today}</span>
      </div>
    </header>
  );
}

export default Topbar;