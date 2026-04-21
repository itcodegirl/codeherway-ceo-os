import ActionControl from './ActionControl';

function PageHeader({
  title,
  description,
  actionText,
  actionTo,
  onAction,
  actionLabel,
}) {
  return (
    <section className="page-intro">
      <div>
        <h1 className="page-title">{title}</h1>
        {description ? <p className="helper-text">{description}</p> : null}
      </div>
      <ActionControl
        actionText={actionText}
        actionTo={actionTo}
        onAction={onAction}
        actionLabel={actionLabel}
      />
    </section>
  );
}

export default PageHeader;
