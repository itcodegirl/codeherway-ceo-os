import ChiefSectionCard from "./ChiefSectionCard";

export default function ChiefTaskList({ items = [], onAccept }) {
  if (!items.length) return null;

  return (
    <ChiefSectionCard title="Tasks" count={items.length}>
      {items.map((item, index) => (
        <div className="chief-item" key={`${item.title}-${index}`}>
          <div className="chief-item-copy">
            <h5>{item.title}</h5>
            <small>{item.status || "Planned"}</small>
          </div>

          <button type="button" onClick={() => onAccept(item)}>
            Add to Weekly
          </button>
        </div>
      ))}
    </ChiefSectionCard>
  );
}
