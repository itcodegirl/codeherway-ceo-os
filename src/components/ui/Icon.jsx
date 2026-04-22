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
    trend: <path d="M4 16h16M6 14l4-4 3 3 5-6" {...commonProps} />,
    activity: (
      <>
        <path d="M3 12h4l2.2-5 3.6 10 2.2-5H21" {...commonProps} />
      </>
    ),
    add: (
      <>
        <path d="M12 5v14M5 12h14" {...commonProps} />
      </>
    ),
    copy: (
      <>
        <rect x="9" y="9" width="11" height="11" rx="2" {...commonProps} />
        <path d="M6 15H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v1" {...commonProps} />
      </>
    ),
    refresh: <path d="M20 11a8 8 0 1 0 2 5.5M20 11v5h-5" {...commonProps} />,
    close: (
      <>
        <path d="m6 6 12 12M18 6 6 18" {...commonProps} />
      </>
    ),
    edit: (
      <>
        <path d="M4 20h4l10-10-4-4L4 16v4Z" {...commonProps} />
        <path d="m12 6 4 4" {...commonProps} />
      </>
    ),
    delete: (
      <>
        <path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M7 7l1 12a1 1 0 0 0 1 .9h6a1 1 0 0 0 1-.9l1-12" {...commonProps} />
      </>
    ),
    check: <path d="m5 13 4 4L19 7" {...commonProps} />,
    back: <path d="M20 12H6m6 6-6-6 6-6" {...commonProps} />,
    warning: (
      <>
        <path d="M12 4 3 20h18L12 4Z" {...commonProps} />
        <path d="M12 10v4M12 17h.01" {...commonProps} />
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
