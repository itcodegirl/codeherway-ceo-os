import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import CrudPageTemplate from './CrudPageTemplate';

function renderWithRouter(ui) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

describe('CrudPageTemplate', () => {
  it('renders grouped header, status, summary, and section content', () => {
    renderWithRouter(
      <CrudPageTemplate
        pageClassName="content-page"
        header={{
          title: 'Content OS',
          description: 'Track content workflow.',
        }}
        status={{
          sourceNote: 'Data source: Supabase (live persistence).',
          sourceNoteClassName: 'content-source-note',
          isLoading: false,
        }}
        summary={{
          content: <p>Summary content</p>,
        }}
        section={{
          title: 'Publishing Workflow',
          iconName: 'content',
          content: <p>Section body</p>,
        }}
      />,
    );

    expect(screen.getByRole('heading', { name: 'Content OS' })).toBeInTheDocument();
    expect(screen.getByText('Data source: Supabase (live persistence).')).toBeInTheDocument();
    expect(screen.getByText('Summary content')).toBeInTheDocument();
    expect(screen.getByText('Section body')).toBeInTheDocument();
  });

  it('renders loading summary/section content and announcement while loading', () => {
    renderWithRouter(
      <CrudPageTemplate
        pageClassName="opportunities-page"
        header={{
          title: 'Opportunities',
          description: 'Track pipeline.',
        }}
        status={{
          isLoading: true,
          loadingAnnouncement: 'Loading opportunities data.',
        }}
        summary={{
          loadingContent: <p>Loading summary</p>,
          content: <p>Loaded summary</p>,
        }}
        section={{
          title: 'Pipeline Overview',
          loadingContent: <p>Loading section</p>,
          content: <p>Loaded section</p>,
        }}
      />,
    );

    expect(screen.getByText('Loading opportunities data.')).toBeInTheDocument();
    expect(screen.getByText('Loading summary')).toBeInTheDocument();
    expect(screen.getByText('Loading section')).toBeInTheDocument();
    expect(screen.queryByText('Loaded summary')).not.toBeInTheDocument();
    expect(screen.queryByText('Loaded section')).not.toBeInTheDocument();
  });

  it('renders empty state when section is empty and not loading', () => {
    renderWithRouter(
      <CrudPageTemplate
        pageClassName="content-page"
        header={{
          title: 'Content OS',
          description: 'Track content workflow.',
        }}
        status={{
          isLoading: false,
        }}
        summary={{
          content: <p>Summary content</p>,
        }}
        section={{
          title: 'Publishing Workflow',
          isEmpty: true,
          emptyState: {
            title: 'No content items yet',
            description: 'Add your first draft to begin tracking your publishing pipeline.',
            action: <button type="button">Add Content</button>,
          },
          content: <p>Loaded section</p>,
        }}
      />,
    );

    expect(screen.getByText('No content items yet')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add Content' })).toBeInTheDocument();
    expect(screen.queryByText('Loaded section')).not.toBeInTheDocument();
  });
});
