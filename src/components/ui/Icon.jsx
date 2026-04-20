function Icon({ name = 'spark', size = 16, className = '' }) {
  const commonProps = {
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
  };

  const icons = {
    dashboard: (
      <>
        <rect x="3" y="3" width="8" height="8" rx="1.5" {...commonProps} />
        <rect x="13" y="3" width="8" height="5" rx="1.5" {...commonProps} />
        <rect x="13" y="10" width="8" height="11" rx="1.5" {...commonProps} />
        <rect x="3" y="13" width="8" height="8" rx="1.5" {...commonProps} />
      </>
    ),
    opportunities: <path d="M4 16l5-5 4 4 7-7M14 8h6v6" {...commonProps} />,
    content: (
      <>
        <path d="M7 3h7l5 5v13a1 1 0 0 1-1 1H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" {...commonProps} />
        <path d="M14 3v6h6M9 13h6M9 17h6" {...commonProps} />
      </>
    ),
    weekly: (
      <>
        <rect x="3" y="5" width="18" height="16" rx="2" {...commonProps} />
        <path d="M8 3v4M16 3v4M3 10h18" {...commonProps} />
      </>
    ),
    chief: (
      <>
        <path d="m12 3 1.9 4.2L18 9l-4.1 1.8L12 15l-1.9-4.2L6 9l4.1-1.8Z" {...commonProps} />
        <path d="m19 15 .8 1.7L21.5 17l-1.7.8L19 19.5l-.8-1.7-1.7-.8 1.7-.8Z" {...commonProps} />
      </>
    ),
    settings: (
      <>
        <circle cx="12" cy="12" r="3.2" {...commonProps} />
        <path d="M19.4 15a1 1 0 0 0 .2 1.1l.1.1a2 2 0 0 1-2.8 2.8l-.1-.1a1 1 0 0 0-1.1-.2 1 1 0 0 0-.6.9V20a2 2 0 0 1-4 0v-.2a1 1 0 0 0-.6-.9 1 1 0 0 0-1.1.2l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1 1 0 0 0 .2-1.1 1 1 0 0 0-.9-.6H4a2 2 0 0 1 0-4h.2a1 1 0 0 0 .9-.6 1 1 0 0 0-.2-1.1l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1 1 0 0 0 1.1.2 1 1 0 0 0 .6-.9V4a2 2 0 0 1 4 0v.2a1 1 0 0 0 .6.9 1 1 0 0 0 1.1-.2l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1 1 0 0 0-.2 1.1 1 1 0 0 0 .9.6h.2a2 2 0 0 1 0 4h-.2a1 1 0 0 0-.9.6Z" {...commonProps} />
      </>
    ),
    section: (
      <>
        <rect x="3" y="4" width="18" height="16" rx="2" {...commonProps} />
        <path d="M8 4v16" {...commonProps} />
      </>
    ),
    action: <path d="M7 17 17 7M8 7h9v9" {...commonProps} />,
    spark: (
      <>
        <path d="m12 3 1.8 4 4 1.8-4 1.8-1.8 4-1.8-4-4-1.8 4-1.8Z" {...commonProps} />
      </>
    ),
  };

  return (
    <svg
      className={`ui-icon ${className}`.trim()}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      {icons[name] || icons.spark}
    </svg>
  );
}

export default Icon;
