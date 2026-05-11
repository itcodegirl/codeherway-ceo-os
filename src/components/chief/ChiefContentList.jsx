import ChiefSectionCard from "./ChiefSectionCard";

function getActionLabel(isAccepting, isAccepted) {
  if (isAccepting) {
    return "Saving...";
  }

  if (isAccepted) {
    return "Added";
  }

  return "Add to Content";
}

export default function ChiefContentList({
  items = [],
  onAccept,
  isAccepted,
  isAccepting
}) {
  if (!items.length) return null;

  return (
    <ChiefSectionCard title="Content Ideas" count={items.length}>
      {items.map((item, index) => {
        const accepting = Boolean(isAccepting?.(item));
        const accepted = Boolean(isAccepted?.(item));

        return (
          <div className="chief-item" key={`${item.title}-${index}`}>
            <div className="chief-item-copy">
              <h4>{item.title}</h4>
              <p>{item.summary}</p>
              <small>
                {item.platform} · {item.status}
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
