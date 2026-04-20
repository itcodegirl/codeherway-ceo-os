import { Link } from 'react-router-dom';

function SectionCard({
  title,
  children,
  actionText,
  actionTo,
  onAction,
  actionLabel,
}) {
  const action = actionText
    ? actionTo
      ? (
          <Link
            className="section-card__action action-button"
            to={actionTo}
            aria-label={actionLabel || actionText}
          >
            {actionText}
          </Link>
        )
      : (
          <button
            type="button"
            className="section-card__action action-button"
            onClick={onAction || undefined}
            aria-label={actionLabel || actionText}
          >
            {actionText}
          </button>
        )
    : null;

  return (
    <section className="section-card">
      <div className="section-card__header">
        <h2>{title}</h2>
        {action}
      </div>
      <div className="section-card__body">{children}</div>
    </section>
  );
}

export default SectionCard;
