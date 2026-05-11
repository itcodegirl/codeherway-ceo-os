import ChiefSectionCard from "./ChiefSectionCard";

function getActionLabel(isAccepting, isAccepted) {
  if (isAccepting) {
    return "Saving...";
  }

  if (isAccepted) {
    return "Added";
  }

  return "Add to Weekly";
}

export default function ChiefPriorityList({
  items = [],
  onAccept,
  isAccepted,
  isAccepting
}) {
  if (!items.length) return null;

  return (
    <ChiefSectionCard title="Priorities" count={items.length}>
      {items.map((item, index) => {
        const accepting = Boolean(isAccepting?.(item));
        const accepted = Boolean(isAccepted?.(item));

        return (
          <div className="chief-item" key={`${item.title}-${index}`}>
            <div className="chief-item-copy">
              <h4>{item.title}</h4>
              <p>{item.reason}</p>
              <small>
                Owner: {item.owner || "You"} · Status: {item.status || "Planned"}
              </small>
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
