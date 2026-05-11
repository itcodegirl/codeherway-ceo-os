import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import PanelErrorFallback from './PanelErrorFallback';

describe('src/components/ui/PanelErrorFallback', () => {
  it('renders a calm focus-panel fallback with the panel name in the copy', () => {
    render(<PanelErrorFallback panelName="Open loops" />);

    const article = screen.getByLabelText('Open loops panel');
    expect(article).toBeInTheDocument();
    expect(article).toHaveClass('focus-panel');
    expect(article).toHaveTextContent(
      'Open loops couldn’t load. Refresh the page to retry.',
    );
  });

  it('supports modifier class names and a custom aria-label', () => {
    render(
      <PanelErrorFallback
        panelName="Reset"
        panelClassName="focus-panel focus-panel--reset"
        ariaLabel="Reset panel"
      />,
    );

    const article = screen.getByLabelText('Reset panel');
    expect(article).toHaveClass('focus-panel');
    expect(article).toHaveClass('focus-panel--reset');
  });
});
