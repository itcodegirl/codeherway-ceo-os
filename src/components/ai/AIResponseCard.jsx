import Icon from '../ui/Icon';

function AIResponseCard({ title, content }) {
  if (!content) {
    return null;
  }

  return (
    <article className="section-card">
      <div className="section-card__header">
        <h3 className="section-card__title">
          <Icon name="section" size={16} className="section-card__title-icon" />
          <span>{title}</span>
        </h3>
      </div>
      <div className="section-card__body">
        <p className="chief-response__text">{content}</p>
      </div>
    </article>
  );
}

export default AIResponseCard;
