import ChiefSectionCard from "./ChiefSectionCard";
import { getChiefAcceptLabel } from "./chiefAcceptLabel";

export default function ChiefOpportunityList({
  items = [],
  onAccept,
  isAccepted,
  isAccepting
}) {
  if (!items.length) return null;

  return (
    <ChiefSectionCard
      title="Opportunities"
      count={items.length}
      destinationNote="Accepting creates a tracked record in your Opportunities pipeline."
    >
      {items.map((item, index) => {
        const accepting = Boolean(isAccepting?.(item));
        const accepted = Boolean(isAccepted?.(item));
        const stageLabel = item.stage || "New";

        return (
          <div className="chief-item" key={`${item.name}-${index}`}>
            <div className="chief-item-copy">
              <h4>{item.name}</h4>
              <p>{item.company}</p>
              <small>
                {item.priority} priority · {stageLabel}
              </small>
              <p className="chief-next-step">Next step: {item.nextStep}</p>
            </div>

            <div className="chief-item-action">
              <p className="chief-item-destination">
                {accepted ? "In Opportunities" : `→ Opportunities · ${stageLabel}`}
              </p>
              <button
                type="button"
                disabled={accepting || accepted}
                onClick={() => onAccept(item)}
              >
                {getChiefAcceptLabel({ isAccepting: accepting, isAccepted: accepted, readyLabel: "Add to Opportunities" })}
              </button>
            </div>
          </div>
        );
      })}
    </ChiefSectionCard>
  );
}
