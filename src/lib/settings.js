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
