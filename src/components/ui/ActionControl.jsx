import { Link, useLocation } from 'react-router-dom';
import Button from './Button';
import Icon from './Icon';
import { normalizePath } from '../../lib/utils';

function resolveActionIconName(actionText, actionTo) {
  const normalizedActionText = typeof actionText === 'string' ? actionText.toLowerCase() : '';

  if (normalizedActionText.includes('add') || normalizedActionText.includes('create')) {
    return 'add';
  }

  if (normalizedActionText.includes('copy')) {
    return 'copy';
  }

  if (
    normalizedActionText.includes('reset')
    || normalizedActionText.includes('retry')
    || normalizedActionText.includes('reload')
    || normalizedActionText.includes('refresh')
  ) {
    return 'refresh';
  }

  if (normalizedActionText.includes('delete') || normalizedActionText.includes('remove')) {
    return 'delete';
  }

  if (normalizedActionText.includes('edit')) {
    return 'edit';
  }

  if (normalizedActionText.includes('save')) {
    return 'check';
  }

  if (normalizedActionText.includes('close')) {
    return 'close';
  }

  if (normalizedActionText.includes('back')) {
    return 'back';
  }

  if (actionTo) {
    return 'action';
  }

  return 'spark';
}

function ActionControl({
  actionText,
  actionTo,
  onAction,
  actionLabel,
}) {
  const location = useLocation();
  const normalizedCurrentPath = normalizePath(location.pathname);
  const normalizedTargetPath = normalizePath(actionTo);
  const isSelfNavigation = Boolean(actionTo && normalizedTargetPath === normalizedCurrentPath);

  const shouldRenderLinkAction = Boolean(actionText && actionTo && !isSelfNavigation);
  const shouldRenderButtonAction = Boolean(actionText && onAction && (!actionTo || isSelfNavigation));
  const hasAction = shouldRenderLinkAction || shouldRenderButtonAction;
  const actionIconName = resolveActionIconName(actionText, actionTo);

  if (!actionText || !hasAction) {
    return null;
  }

  if (shouldRenderLinkAction) {
    return (
      <Link
        className="action-button"
        to={actionTo}
        aria-label={actionLabel || actionText}
      >
        {actionText}
        <Icon name={actionIconName} size={14} className="action-button__icon" />
      </Link>
    );
  }

  return (
    <Button
      type="button"
      onClick={onAction || undefined}
      ariaLabel={actionLabel || actionText}
      icon={{ name: actionIconName, size: 14 }}
    >
      {actionText}
    </Button>
  );
}

export default ActionControl;
