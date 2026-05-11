import { useId } from 'react';
import SectionCard from '../ui/SectionCard';
import Button from '../ui/Button';
import { SOURCE_NOTICE_DEMO_DATA } from '../../lib/uiCopy';

/**
 * Workspace data controls + local data health. All side effects (setup
 * choice toggling, backup export, file import) are owned by the parent
 * Settings page; this component is pure presentation plus a small file
 * input ref.
 */
function SettingsWorkspaceDataSection({
  hasWorkspaceSetupChoice,
  isDemoMode,
  onStartBlankWorkspace,
  onLoadDemoWorkspace,
  onClearDemoData,
  dataHealth,
  pendingSyncCount,
  formatSavedAt,
  backupScopeCopy,
  healthIssueCopy,
  pendingSyncCopy,
  onExportBackup,
  onImportClick,
  onImportBackup,
  importInputRef,
  portabilityStatus,
}) {
  const importInputId = useId();

  return (
    <SectionCard title="Workspace Data" iconName="section">
      <div className="settings-workspace-setup">
        <p className="helper-text">
          {hasWorkspaceSetupChoice
            ? isDemoMode
              ? SOURCE_NOTICE_DEMO_DATA
              : 'Blank local workspace is active on this device.'
            : 'No setup choice has been saved yet. Demo records are shown for review until you choose.'}
        </p>
        <div className="settings-workspace-setup__actions">
          <Button type="button" size="small" onClick={onStartBlankWorkspace} icon={{ name: 'check', size: 14 }}>
            Start blank
          </Button>
          <Button type="button" size="small" variant="ghost" onClick={onLoadDemoWorkspace} icon={{ name: 'section', size: 14 }}>
            Load demo workspace
          </Button>
          <Button
            type="button"
            size="small"
            variant="ghost"
            onClick={onClearDemoData}
            disabled={!isDemoMode}
            ariaLabel={isDemoMode ? 'Clear demo data from this device' : 'Clear demo data unavailable'}
          >
            Clear demo data
          </Button>
        </div>
      </div>

      <div className="settings-data-health" role="group" aria-label="Local data health">
        <div className="settings-data-health__summary" role="list">
          <span role="listitem">
            <strong>{dataHealth.localRecordCount}</strong>
            Local records
          </span>
          <span role="listitem">
            <strong>{dataHealth.restorableStoreCount}</strong>
            Backup stores
          </span>
          <span role="listitem">
            <strong>{pendingSyncCount}</strong>
            Pending sync
          </span>
        </div>
        <p className="helper-text">
          {backupScopeCopy} {healthIssueCopy} {pendingSyncCopy}
        </p>
        <p className="helper-text helper-text--muted">
          {formatSavedAt(dataHealth.lastSettingsSavedAt)}
        </p>
        <div className="settings-workspace-setup__actions">
          <Button
            type="button"
            size="small"
            onClick={onExportBackup}
            disabled={!dataHealth.isAvailable}
            ariaLabel="Export local workspace backup"
            icon={{ name: 'copy', size: 14 }}
          >
            Export backup
          </Button>
          <Button
            type="button"
            size="small"
            variant="ghost"
            onClick={onImportClick}
            disabled={!dataHealth.isAvailable}
            ariaLabel="Import local workspace backup"
            icon={{ name: 'section', size: 14 }}
          >
            Import backup
          </Button>
          <input
            id={importInputId}
            ref={importInputRef}
            className="settings-backup-file"
            type="file"
            accept="application/json,.json"
            aria-label="Import local workspace backup file"
            onChange={onImportBackup}
          />
        </div>
        <p className="helper-text helper-text--muted">
          Import replaces matching local stores only. It does not delete other local data or migrate anything into Supabase.
        </p>
        {portabilityStatus.message ? (
          <p
            className={`helper-text settings-backup-status settings-backup-status--${portabilityStatus.tone}`}
            role={portabilityStatus.tone === 'error' ? 'alert' : 'status'}
            aria-live="polite"
          >
            {portabilityStatus.message}
          </p>
        ) : null}
      </div>
    </SectionCard>
  );
}

export default SettingsWorkspaceDataSection;
