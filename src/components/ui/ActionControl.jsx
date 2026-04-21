import { Link, useLocation } from 'react-router-dom';
import Button from './Button';
import Icon from './Icon';
import { normalizePath } from '../../lib/utils';

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
        <Icon name="action" size={14} className="action-button__icon" />
      </Link>
    );
  }

  return (
    <Button
      type="button"
      onClick={onAction || undefined}
      ariaLabel={actionLabel || actionText}
      icon={{ name: 'action', size: 14 }}
    >
      {actionText}
    </Button>
  );
}

export default ActionControl;
