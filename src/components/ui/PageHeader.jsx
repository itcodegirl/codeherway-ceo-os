import { Link } from 'react-router-dom';

function PageHeader({ title, description, actionText, actionTo, onAction }) {
  const action = actionText
    ? actionTo
      ? (
          <Link
            className="action-button"
            to={actionTo}
            aria-label={actionText}
          >
            {actionText}
          </Link>
        )
      : (
          <button type="button" className="action-button" onClick={onAction}>
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
