import { useEffect, useMemo, useState } from 'react';
import { useWorkspaceSettings } from '../../hooks/useWorkspaceSettings';
import { formatIsoDate } from '../../lib/utils';
import SyncStatusPill from './SyncStatusPill';
import SaveStatusPill from './SaveStatusPill';

const ONE_MINUTE_MS = 60 * 1000;

function getMsUntilNextMinute(nowMs = Date.now()) {
  const elapsedMsInMinute = nowMs % ONE_MINUTE_MS;
  return elapsedMsInMinute === 0 ? ONE_MINUTE_MS : ONE_MINUTE_MS - elapsedMsInMinute;
}

function Topbar({ pageTitle = 'Focus Home' }) {
  const { teamName, timezone } = useWorkspaceSettings();
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

  const todayFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(undefined, {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
        timeZone: timezone || undefined,
      }),
    [timezone],
  );

  const today = todayFormatter.format(now);
  const isoDate = formatIsoDate(now, timezone);
  const timezoneLabel = timezone || 'Local Time';

  return (
    <header className="topbar">
      <div className="topbar__left">
        <p className="topbar__label topbar__label--desktop">Team: {teamName}</p>
        <p className="topbar__title">{pageTitle}</p>
      </div>

      <div className="topbar__right">
        <SaveStatusPill />
        <SyncStatusPill />
        <time className="topbar__meta" dateTime={isoDate}>
          {today}
        </time>
        <p className="topbar__status topbar__status--desktop">Current period: This Week</p>
        <p
          className="topbar__status topbar__status--desktop"
          title={`Date shown in ${timezoneLabel}`}
        >
          Time zone: {timezoneLabel}
        </p>
      </div>
    </header>
  );
}

export default Topbar;
