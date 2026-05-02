export const STALE_RECORD_ERROR_CODE = 'STALE_RECORD';

/**
 * Thrown when an optimistic-locking check detects that a record has been
 * mutated by another tab/window since the user opened the editor. Callers
 * (useCrudPage) detect the code and prompt the user to reload before saving.
 */
export class StaleRecordError extends Error {
  constructor(message = 'Record changed in another window. Reload to see the latest version.') {
    super(message);
    this.name = 'StaleRecordError';
    this.code = STALE_RECORD_ERROR_CODE;
  }
}

export function isStaleRecordError(error) {
  return Boolean(error)
    && (error?.code === STALE_RECORD_ERROR_CODE || error?.name === 'StaleRecordError');
}
