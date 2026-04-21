import Button from '../ui/Button';

function WeeklyTextList({
  items = [],
  itemTypeLabel,
  getDotClassName,
  getPrimaryText,
  getSecondaryText,
  onEditItem,
  onDeleteItem,
}) {
  return (
    <ul className="weekly-list">
      {items.map((item) => {
        const primaryText = getPrimaryText(item);
        const secondaryText = getSecondaryText ? getSecondaryText(item) : '';
        const dotClassName = getDotClassName ? getDotClassName(item) : '';

        return (
          <li key={item.id} className="weekly-list__item">
            <span className={`weekly-list__dot ${dotClassName}`.trim()} aria-hidden="true" />
            <div className="weekly-list__content">
              <div className="weekly-list__details">
                <p className="weekly-note">{primaryText}</p>
                {secondaryText ? <p className="helper-text helper-text--offset">{secondaryText}</p> : null}
              </div>
              <div className="weekly-list__actions">
                <Button
                  type="button"
                  size="small"
                  variant="ghost"
                  onClick={() => onEditItem?.(item)}
                  disabled={!onEditItem}
                  ariaLabel={`Edit ${itemTypeLabel} ${primaryText}`}
                >
                  Edit
                </Button>
                <Button
                  type="button"
                  size="small"
                  variant="ghost"
                  onClick={() => onDeleteItem?.(item)}
                  disabled={!onDeleteItem}
                  ariaLabel={`Delete ${itemTypeLabel} ${primaryText}`}
                >
                  Delete
                </Button>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export default WeeklyTextList;
