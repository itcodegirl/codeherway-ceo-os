import Button from './Button';
import { SOURCE_NOTICE_LOCAL_ONLY, SOURCE_NOTICE_SUPABASE } from '../../lib/uiCopy';

function resolveRecoveryText(source, recoveryText) {
  if (typeof recoveryText === 'string' && recoveryText.trim()) {
    return recoveryText.trim();
  }

  if (source === 'supabase') {
    return 'Showing the latest workspace snapshot available while live sync reconnects.';
  }

  return 'Showing the latest local workspace snapshot while we retry.';
}

function SourceStatusNotice({
  source = 'local',
  supabaseText = SOURCE_NOTICE_SUPABASE,
  localText = SOURCE_NOTICE_LOCAL_ONLY,
  loadError = '',
  recoveryText = '',
  onRetry = null,
  retryAriaLabel = 'Retry loading data',
  retryText = 'Retry',
  retryDisabled = false,
}) {
  const sourceText = source === 'supabase' ? supabaseText : localText;
  const recoveryMessage = resolveRecoveryText(source, recoveryText);
  const sourceClassName = source === 'supabase'
    ? 'source-status source-status--supabase'
    : 'source-status source-status--local';
  const errorMessageId = loadError ? `source-status-error-${source}` : undefined;
  const recoveryMessageId = loadError ? `source-status-recovery-${source}` : undefined;

  return (
    <>
      <p className={sourceClassName} role="status" aria-live="polite">
        <span className="source-status__dot" aria-hidden="true" />
        <span>{sourceText}</span>
      </p>
      {loadError ? (
        <div className="helper-inline-actions">
          <div className="source-status__recovery-group">
            <p id={errorMessageId} className="helper-text" role="alert">{loadError}</p>
            <p id={recoveryMessageId} className="helper-text source-status__recovery">{recoveryMessage}</p>
          </div>
          {typeof onRetry === 'function' ? (
            <Button
              type="button"
              size="small"
              disabled={retryDisabled}
              aria-describedby={[errorMessageId, recoveryMessageId].filter(Boolean).join(' ') || undefined}
              onClick={() => {
                void onRetry();
              }}
              ariaLabel={retryAriaLabel}
            >
              {retryText}
            </Button>
          ) : null}
        </div>
      ) : null}
    </>
  );
}

export default SourceStatusNotice;
