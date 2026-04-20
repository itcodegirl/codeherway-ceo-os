function AIResponseCard({ title, content }) {
  if (!content) {
    return null;
  }

  return (
    <article className="section-card">
      <div className="section-card__header">
        <h2>{title}</h2>
      </div>
      <div className="section-card__body">
        <p className="chief-response__text">{content}</p>
      </div>
    </article>
  );
}

export default AIResponseCard;
