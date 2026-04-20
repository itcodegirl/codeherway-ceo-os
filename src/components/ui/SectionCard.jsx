import { Link } from 'react-router-dom';
import Icon from './Icon';

const SECTION_TITLE_ICON = <Icon name="section" size={16} className="section-card__title-icon" />;
const SECTION_ACTION_ICON = <Icon name="action" size={14} className="action-button__icon" />;

function SectionCard({
  title,
  children,
  actionText,
  actionTo,
  onAction,
  actionLabel,
}) {
  const hasAction = Boolean(actionText && (actionTo || onAction));
  const action = actionText && hasAction
    ? actionTo
      ? (
          <Link
            className="action-button"
            to={actionTo}
            aria-label={actionLabel || actionText}
          >
            {actionText}
            {SECTION_ACTION_ICON}
          </Link>
        )
      : (
          <button
            type="button"
            className="action-button"
            onClick={onAction || undefined}
            aria-label={actionLabel || actionText}
          >
            {actionText}
            {SECTION_ACTION_ICON}
          </button>
        )
    : null;

  return (
    <section className="section-card">
      <div className="section-card__header">
        <h2 className="section-card__title">
          {SECTION_TITLE_ICON}
          <span>{title}</span>
        </h2>
        {action}
      </div>
      <div className="section-card__body">{children}</div>
    </section>
  );
}

export default SectionCard;
