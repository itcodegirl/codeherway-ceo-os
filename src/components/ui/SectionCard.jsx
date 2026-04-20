function SectionCard({ title, children, actionText }) {
  return (
    <section className="section-card">
      <div className="section-card__header">
        <h2>{title}</h2>
        {actionText ? <button className="section-card__action">{actionText}</button> : null}
      </div>
      <div className="section-card__body">{children}</div>
    </section>
  );
}

export default SectionCard;