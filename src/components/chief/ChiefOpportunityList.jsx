import ChiefSectionCard from "./ChiefSectionCard";

function getActionLabel(isAccepting, isAccepted) {
  if (isAccepting) {
    return "Saving...";
  }

  if (isAccepted) {
    return "Added";
  }

  return "Add to Opportunities";
}

export default function ChiefOpportunityList({
  items = [],
  onAccept,
  isAccepted,
  isAccepting
}) {
  if (!items.length) return null;

  return (
    <ChiefSectionCard title="Opportunities" count={items.length}>
      {items.map((item, index) => {
        const accepting = Boolean(isAccepting?.(item));
        const accepted = Boolean(isAccepted?.(item));

        return (
          <div className="chief-item" key={`${item.name}-${index}`}>
            <div className="chief-item-copy">
              <h5>{item.name}</h5>
              <p>{item.company}</p>
              <small>
                {item.priority} priority · {item.stage}
              </small>
              <p className="chief-next-step">Next step: {item.nextStep}</p>
            </div>

            <button
              type="button"
              disabled={accepting || accepted}
              onClick={() => onAccept(item)}
            >
              {getActionLabel(accepting, accepted)}
            </button>
          </div>
        );
      })}
    </ChiefSectionCard>
  );
}
