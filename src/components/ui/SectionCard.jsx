import { Link, useLocation } from 'react-router-dom';
import Icon from './Icon';
import Button from './Button';

function normalizePath(path) {
  if (!path) {
    return '';
  }

  const normalized = path.replace(/\/+$/, '');
  return normalized || '/';
}

function SectionCard({
  title,
  children,
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
            onClick={onAction || undefined}
            ariaLabel={actionLabel || actionText}
            icon={{ name: 'action', size: 14 }}
          >
            {actionText}
          </Button>
        )
    : null;

  return (
    <section className="section-card">
      <div className="section-card__header">
        <h2 className="section-card__title">
          <Icon name="section" size={16} className="section-card__title-icon" />
          <span>{title}</span>
        </h2>
        {action}
      </div>
      <div className="section-card__body">{children}</div>
    </section>
  );
}

export default SectionCard;
