import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import LastSavedIndicator from './LastSavedIndicator';

describe('src/components/ui/LastSavedIndicator', () => {
  it('renders nothing when savedAt is missing or zero', () => {
    const { container: emptyContainer } = render(<LastSavedIndicator savedAt={undefined} />);
    expect(emptyContainer).toBeEmptyDOMElement();

    const { container: zeroContainer } = render(<LastSavedIndicator savedAt={0} />);
    expect(zeroContainer).toBeEmptyDOMElement();
  });

  it('renders nothing when savedAt is non-finite (Infinity, NaN, garbage string)', () => {
    const { container: infinityContainer } = render(<LastSavedIndicator savedAt={Infinity} />);
    expect(infinityContainer).toBeEmptyDOMElement();

    const { container: nanContainer } = render(<LastSavedIndicator savedAt={Number.NaN} />);
    expect(nanContainer).toBeEmptyDOMElement();

    const { container: garbageContainer } = render(<LastSavedIndicator savedAt="not-a-timestamp" />);
    expect(garbageContainer).toBeEmptyDOMElement();
  });

  it('renders a <time> with the ISO datetime when savedAt is a positive finite timestamp', () => {
    const savedAt = new Date('2026-05-11T15:30:00.000Z').getTime();
    render(<LastSavedIndicator savedAt={savedAt} />);

    const timeNode = screen.getByText(
      (_content, node) => node?.tagName === 'TIME',
    );
    expect(timeNode).toHaveAttribute('dateTime', '2026-05-11T15:30:00.000Z');
  });
});
