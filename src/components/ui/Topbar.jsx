import { useEffect, useMemo, useState } from 'react';
import { usePersistentState } from '../../hooks/usePersistentState';
import { DEFAULT_SETTINGS, resolveTeamName, resolveTimeZone } from '../../lib/settings';

function formatIsoDate(date, timeZone) {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: timeZone || undefined,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const parts = formatter.formatToParts(date);
  const year = parts.find((part) => part.type === 'year')?.value || '0000';
  const month = parts.find((part) => part.type === 'month')?.value || '01';
  const day = parts.find((part) => part.type === 'day')?.value || '01';

  return `${year}-${month}-${day}`;
}

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
        <h2 className="topbar__title">Welcome back, {teamName}</h2>
      </div>

      <div className="topbar__right">
        <time className="topbar__meta" dateTime={isoDate}>
          {today}
        </time>
        <span className="topbar__status" aria-label="Current period set to this week">
          This Week
        </span>
        <span className="topbar__status" title={`Date shown in ${timezoneLabel}`}>
          {timezoneLabel}
        </span>
      </div>
    </header>
  );
}

export default Topbar;
