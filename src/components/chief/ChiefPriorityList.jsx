import ChiefSectionCard from "./ChiefSectionCard";
import { getChiefAcceptLabel } from "./chiefAcceptLabel";

export default function ChiefPriorityList({
  items = [],
  onAccept,
  isAccepted,
  isAccepting
}) {
  if (!items.length) return null;

  return (
    <ChiefSectionCard
      title="Priorities"
      count={items.length}
      destinationNote="Accepting adds each item to this week's Weekly Brief priorities."
    >
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

            <div className="chief-item-action">
              <p className="chief-item-destination">
                {accepted ? "In Weekly Brief" : "→ Weekly Brief priority"}
              </p>
              <button
                type="button"
                disabled={accepting || accepted}
                onClick={() => onAccept(item)}
              >
                {getChiefAcceptLabel({ isAccepting: accepting, isAccepted: accepted, readyLabel: "Add to Weekly" })}
              </button>
            </div>
          </div>
        );
      })}
    </ChiefSectionCard>
  );
}
