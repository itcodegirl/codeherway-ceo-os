export function normalizeCollection(values) {
  return Array.isArray(values) ? values : [];
}

export function normalizeText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

export function hasText(value) {
  return normalizeText(value).length > 0;
}
