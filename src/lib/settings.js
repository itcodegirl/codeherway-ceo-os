export const DEFAULT_SETTINGS = {
  timezone: 'America/Chicago',
  teamName: 'CodeHerWay',
  emailDigest: true,
  keyboardShortcuts: false,
  autoSave: true,
};

export function resolveTimeZone(input) {
  if (typeof input !== 'string' || !input.trim()) {
    return '';
  }

  const candidate = input.trim();

  try {
    new Intl.DateTimeFormat(undefined, { timeZone: candidate });
    return candidate;
  } catch {
    return '';
  }
}

export function resolveTeamName(input) {
  if (typeof input !== 'string') {
    return DEFAULT_SETTINGS.teamName;
  }

  const trimmed = input.trim();
  return trimmed || DEFAULT_SETTINGS.teamName;
}

const FALLBACK_TIMEZONES = [
  'UTC',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Phoenix',
  'America/Anchorage',
  'America/Sao_Paulo',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Europe/Madrid',
  'Europe/Stockholm',
  'Africa/Cairo',
  'Africa/Johannesburg',
  'Asia/Dubai',
  'Asia/Kolkata',
  'Asia/Singapore',
  'Asia/Tokyo',
  'Asia/Shanghai',
  'Australia/Sydney',
  'Pacific/Auckland',
];

export function getSupportedTimezones() {
  try {
    if (typeof Intl?.supportedValuesOf === 'function') {
      const values = Intl.supportedValuesOf('timeZone');
      if (Array.isArray(values) && values.length > 0) {
        return values;
      }
    }
  } catch {
    // Fall through to the static list.
  }

  return FALLBACK_TIMEZONES;
}

export function getDeviceTimezone() {
  try {
    const zone = new Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (zone && resolveTimeZone(zone)) {
      return zone;
    }
  } catch {
    // Ignore and fall back.
  }

  return DEFAULT_SETTINGS.timezone;
}
