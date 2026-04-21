import ChiefSectionCard from "./ChiefSectionCard";

export default function ChiefOpportunityList({ items = [], onAccept }) {
  if (!items.length) return null;

  return (
    <ChiefSectionCard title="Opportunities" count={items.length}>
      {items.map((item, index) => (
        <div className="chief-item" key={`${item.name}-${index}`}>
          <div className="chief-item-copy">
            <h5>{item.name}</h5>
            <p>{item.company}</p>
            <small>
              {item.priority} priority · {item.stage}
            </small>
            <p className="chief-next-step">Next step: {item.nextStep}</p>
          </div>

          <button type="button" onClick={() => onAccept(item)}>
            Add to Opportunities
          </button>
        </div>
      ))}
    </ChiefSectionCard>
  );
}
