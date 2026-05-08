import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import OpenLoopsPanel from './OpenLoopsPanel';

describe('OpenLoopsPanel', () => {
  it('renders the headline, item counts, suggested loop, and helper text', () => {
    render(
      <OpenLoopsPanel
        openLoops={{
          headline: 'Three loops are still open today.',
          items: [
            { id: 'loops-priorities', count: 2, label: 'priorities in motion' },
            { id: 'loops-content', count: 1, label: 'content draft to ship' },
          ],
          suggestedLoop: 'Send the recap to the Acme thread.',
          canWait: 'The rest can wait until this focus block ends.',
        }}
      />,
    );

    expect(screen.getByText('Three loops are still open today.')).toBeInTheDocument();
    expect(screen.getByText('priorities in motion')).toBeInTheDocument();
    expect(screen.getByText('Send the recap to the Acme thread.')).toBeInTheDocument();
    expect(screen.getByText('The rest can wait until this focus block ends.')).toBeInTheDocument();
  });

  it('omits the items list when there are no loops to summarise', () => {
    render(
      <OpenLoopsPanel
        openLoops={{
          headline: 'Nothing is open right now.',
          items: [],
          suggestedLoop: 'Take five.',
          canWait: 'You earned the calm.',
        }}
      />,
    );

    expect(screen.queryByLabelText('Open loops summary')).not.toBeInTheDocument();
  });
});
