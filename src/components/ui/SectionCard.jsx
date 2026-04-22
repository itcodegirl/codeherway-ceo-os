import Icon from './Icon';
import ActionControl from './ActionControl';

function resolveSectionIconName(title) {
  const normalizedTitle = typeof title === 'string' ? title.toLowerCase() : '';

  if (!normalizedTitle) {
    return 'section';
  }

  if (normalizedTitle.includes('opportunit')) {
    return 'opportunities';
  }

  if (normalizedTitle.includes('content')) {
    return 'content';
  }

  if (normalizedTitle.includes('momentum') || normalizedTitle.includes('trend')) {
    return 'trend';
  }

  if (normalizedTitle.includes('activity')) {
    return 'activity';
  }

  if (
    normalizedTitle.includes('priority')
    || normalizedTitle.includes('weekly')
    || normalizedTitle.includes('review')
  ) {
    return 'weekly';
  }

  if (normalizedTitle.includes('blocker') || normalizedTitle.includes('risk')) {
    return 'warning';
  }

  if (normalizedTitle.includes('setting')) {
    return 'settings';
  }

  if (normalizedTitle.includes('prompt') || normalizedTitle.includes('ai')) {
    return 'chief';
  }

  if (normalizedTitle.includes('snapshot')) {
    return 'dashboard';
  }

  return 'section';
}

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
          <Icon
            name={resolveSectionIconName(title)}
            size={16}
            className="section-card__title-icon"
          />
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
