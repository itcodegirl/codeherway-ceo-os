import Icon from './Icon';
import ActionControl from './ActionControl';

function SectionCard({
  title,
  children,
  actionText,
  actionTo,
  onAction,
  actionLabel,
}) {
  return (
    <section className="section-card">
      <div className="section-card__header">
        <h2 className="section-card__title">
          <Icon name="section" size={16} className="section-card__title-icon" />
          <span>{title}</span>
        </h2>
        <ActionControl
          actionText={actionText}
          actionTo={actionTo}
          onAction={onAction}
          actionLabel={actionLabel}
        />
      </div>
      <div className="section-card__body">{children}</div>
    </section>
  );
}

export default SectionCard;
