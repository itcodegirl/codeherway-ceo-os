import ChiefSectionCard from "./ChiefSectionCard";
import { getChiefAcceptLabel } from "./chiefAcceptLabel";

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
              <h4>{item.title}</h4>
              <small>{item.status || "Planned"}</small>
            </div>

            <button
              type="button"
              disabled={accepting || accepted}
              onClick={() => onAccept(item)}
            >
              {getChiefAcceptLabel({ isAccepting: accepting, isAccepted: accepted, readyLabel: "Add to Weekly" })}
            </button>
          </div>
        );
      })}
    </ChiefSectionCard>
  );
}
