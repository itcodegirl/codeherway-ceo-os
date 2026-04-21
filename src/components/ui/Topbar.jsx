import { useEffect, useMemo, useState } from 'react';
import { usePersistentState } from '../../hooks/usePersistentState';
import { DEFAULT_SETTINGS, resolveTeamName, resolveTimeZone } from '../../lib/settings';
import { formatIsoDate } from '../../lib/utils';

function Topbar() {
  const [settings] = usePersistentState('ceo-os-settings', DEFAULT_SETTINGS);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setNow(new Date());
    }, 60 * 1000);

    return () => {
      clearInterval(intervalId);
    };
  }, []);

  const resolvedTimeZone = useMemo(() => resolveTimeZone(settings?.timezone), [settings?.timezone]);

  const todayFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(undefined, {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
        timeZone: resolvedTimeZone || undefined,
      }),
    [resolvedTimeZone],
  );

  const today = todayFormatter.format(now);
  const isoDate = formatIsoDate(now, resolvedTimeZone);
  const timezoneLabel = resolvedTimeZone || 'Local Time';
  const teamName = resolveTeamName(settings?.teamName);

  return (
    <header className="topbar">
      <div className="topbar__left">
        <p className="topbar__label">Executive Overview</p>
        <p className="topbar__title">Welcome back, {teamName}</p>
      </div>

      <div className="topbar__right">
        <time className="topbar__meta" dateTime={isoDate}>
          {today}
        </time>
        <p className="topbar__status">Current period: This Week</p>
        <p className="topbar__status" title={`Date shown in ${timezoneLabel}`}>
          Time zone: {timezoneLabel}
        </p>
      </div>
    </header>
  );
}

export default Topbar;
