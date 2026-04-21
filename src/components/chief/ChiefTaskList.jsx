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

export default function ChiefTaskList({
  items = [],
  onAccept,
  isAccepted,
  isAccepting
}) {
  if (!items.length) return null;

  return (
    <ChiefSectionCard title="Tasks" count={items.length}>
      {items.map((item, index) => {
        const accepting = Boolean(isAccepting?.(item));
        const accepted = Boolean(isAccepted?.(item));

        return (
          <div className="chief-item" key={`${item.title}-${index}`}>
            <div className="chief-item-copy">
              <h5>{item.title}</h5>
              <small>{item.status || "Planned"}</small>
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
