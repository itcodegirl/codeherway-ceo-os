import Button from './Button';
import { SOURCE_NOTICE_SAMPLE_DATA, SOURCE_NOTICE_SUPABASE } from '../../lib/uiCopy';

function SourceStatusNotice({
  source = 'local',
  supabaseText = SOURCE_NOTICE_SUPABASE,
  localText = SOURCE_NOTICE_SAMPLE_DATA,
  loadError = '',
  onRetry = null,
  retryAriaLabel = 'Retry loading data',
  retryText = 'Retry',
  retryDisabled = false,
}) {
  const sourceText = source === 'supabase' ? supabaseText : localText;

  return (
    <>
      <p className="helper-text">{sourceText}</p>
      {loadError ? (
        <div className="helper-inline-actions">
          <p className="helper-text" role="alert">{loadError}</p>
          {typeof onRetry === 'function' ? (
            <Button
              type="button"
              size="small"
              disabled={retryDisabled}
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
