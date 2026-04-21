import { Link, useLocation } from 'react-router-dom';
import Button from './Button';

function normalizePath(path) {
  if (!path) {
    return '';
  }

  const normalized = path.replace(/\/+$/, '');
  return normalized || '/';
}

function PageHeader({
  title,
  description,
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

  const action = actionText && hasAction
    ? shouldRenderLinkAction
      ? (
          <Link
            className="action-button"
            to={actionTo}
            aria-label={actionLabel || actionText}
          >
            {actionText}
            <Icon name="action" size={14} className="action-button__icon" />
          </Link>
        )
      : (
          <Button
            type="button"
            onClick={onAction}
            ariaLabel={actionLabel || actionText}
            icon={{ name: 'action', size: 14 }}
          >
            {actionText}
          </Button>
        )
    : null;

  return (
    <section className="page-intro">
      <div>
        <h1 className="page-title">{title}</h1>
        {description ? <p className="helper-text">{description}</p> : null}
      </div>
      {action}
    </section>
  );
}

export default PageHeader;
