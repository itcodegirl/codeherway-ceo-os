import { Link } from 'react-router-dom';

function SectionCard({
  title,
  children,
  actionText,
  actionTo,
  onAction,
  actionLabel,
}) {
  if (!actionText) return (
    <section className="section-card">
      <div className="section-card__header">
        <h2>{title}</h2>
      </div>
      <div className="section-card__body">{children}</div>
    </section>
  );

  const ActionButton = ({ children }) =>
    actionTo ? (
      <Link
        className="section-card__action"
        to={actionTo}
        aria-label={actionLabel || actionText}
      >
        {children}
      </Link>
    ) : (
      <button
        type="button"
        className="section-card__action"
        onClick={onAction || undefined}
        aria-label={actionLabel || actionText}
      >
        {children}
      </button>
    );

  return (
    <section className="section-card">
      <div className="section-card__header">
        <h2>{title}</h2>
        <ActionButton>{actionText}</ActionButton>
      </div>
      <div className="section-card__body">{children}</div>
    </section>
  );
}

export default SectionCard;
