import { Link, useLocation } from 'react-router-dom';
import Icon from './Icon';

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
          <button type="button" className="action-button" onClick={onAction} aria-label={actionLabel || actionText}>
            {actionText}
            <Icon name="action" size={14} className="action-button__icon" />
          </button>
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
