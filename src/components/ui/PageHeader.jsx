import { Link } from 'react-router-dom';

function PageHeader({
  title,
  description,
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
          </Link>
        )
      : (
          <button type="button" className="action-button" onClick={onAction} aria-label={actionLabel || actionText}>
            {actionText}
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
