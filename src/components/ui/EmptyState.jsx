/**
 * Calm empty state used by list/CRUD surfaces.
 *
 *   - icon        : optional decorative SVG/Icon node, rendered inside an
 *                   accent-tinted bubble. Marked aria-hidden so screen readers
 *                   skip the visual flourish and announce the title/description
 *                   directly.
 *   - title       : 1-line invitation ("No opportunities yet").
 *   - description : 1-2 sentences of supportive context.
 *   - action      : optional CTA node (usually a Button).
 *
 * The component stays tiny on purpose — the calm-OS thesis says empty states
 * should invite, not lecture.
 */
function EmptyState({ icon, title, description, action }) {
  return (
    <div className="empty-state">
      {icon ? (
        <span className="empty-state__icon" aria-hidden="true">
          {icon}
        </span>
      ) : null}
      <p className="empty-state__title">{title}</p>
      <p className="empty-state__description">{description}</p>
      {action ? <div className="empty-state__action">{action}</div> : null}
    </div>
  );
}

export default EmptyState;
