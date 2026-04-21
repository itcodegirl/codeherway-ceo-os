import ChiefSectionCard from "./ChiefSectionCard";

export default function ChiefContentList({ items = [], onAccept }) {
  if (!items.length) return null;

  return (
    <ChiefSectionCard title="Content Ideas" count={items.length}>
      {items.map((item, index) => (
        <div className="chief-item" key={`${item.title}-${index}`}>
          <div className="chief-item-copy">
            <h5>{item.title}</h5>
            <p>{item.summary}</p>
            <small>
              {item.platform} · {item.status}
            </small>
          </div>

          <button type="button" onClick={() => onAccept(item)}>
            Add to Content
          </button>
        </div>
      ))}
    </ChiefSectionCard>
  );
}
