import { useEffect, useMemo, useState } from 'react';
import { usePersistentState } from '../../hooks/usePersistentState';
import { DEFAULT_SETTINGS, resolveTeamName, resolveTimeZone } from '../../lib/settings';
import { formatIsoDate } from '../../lib/utils';

const ONE_MINUTE_MS = 60 * 1000;

function getMsUntilNextMinute(nowMs = Date.now()) {
  const elapsedMsInMinute = nowMs % ONE_MINUTE_MS;
  return elapsedMsInMinute === 0 ? ONE_MINUTE_MS : ONE_MINUTE_MS - elapsedMsInMinute;
}

function Topbar() {
  const [settings] = usePersistentState('ceo-os-settings', DEFAULT_SETTINGS);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    let intervalId = null;
    const tick = () => {
      setNow(new Date());
    };

    const timeoutId = window.setTimeout(() => {
      tick();
      intervalId = window.setInterval(tick, ONE_MINUTE_MS);
    }, getMsUntilNextMinute(Date.now()));

    return () => {
      window.clearTimeout(timeoutId);
      if (intervalId !== null) {
        window.clearInterval(intervalId);
      }
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
