import { useSystemPulse } from '../../hooks/useSystemPulse';

function SystemPulse() {
  const { isLoading, items, nextMove } = useSystemPulse();

  return (
    <section className="system-pulse" aria-label="System pulse" aria-busy={isLoading}>
      <div className="system-pulse__header">
        <p className="system-pulse__eyebrow">Command Signal</p>
        <p className="system-pulse__next-move">
          <strong>Next Move:</strong>{' '}
          <span aria-live="polite">{isLoading ? 'Syncing your system pulse...' : nextMove}</span>
        </p>
      </div>

      <ul className="system-pulse__nodes" aria-label="System pulse indicators">
        {items.map((item) => (
          <li
            key={item.id}
            className={`system-pulse__node system-pulse__node--${item.tone}`}
            aria-label={`${item.label}: ${item.value}`}
          >
            <span className="system-pulse__node-label">{item.label}</span>
            <strong className="system-pulse__node-value">{item.value}</strong>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default SystemPulse;
