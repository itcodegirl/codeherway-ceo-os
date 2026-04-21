import ChiefSectionCard from "./ChiefSectionCard";

export default function ChiefPriorityList({ items = [], onAccept }) {
  if (!items.length) return null;

  return (
    <ChiefSectionCard title="Priorities" count={items.length}>
      {items.map((item, index) => (
        <div className="chief-item" key={`${item.title}-${index}`}>
          <div className="chief-item-copy">
            <h5>{item.title}</h5>
            <p>{item.reason}</p>
            <small>
              Owner: {item.owner || "You"} · Status: {item.status || "Planned"}
            </small>
          </div>

          <button type="button" onClick={() => onAccept(item)}>
            Add to Weekly
          </button>
        </div>
      ))}
    </ChiefSectionCard>
  );
}
