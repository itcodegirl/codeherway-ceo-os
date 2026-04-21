import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import ChiefOfStaff from './ChiefOfStaff';

vi.mock('../lib/openai', () => ({
  aiConfig: {
    hasProxyEndpoint: true,
    endpoint: '/api/chief-of-staff',
    configuredEndpoint: '/api/chief-of-staff',
  },
  generateChiefOfStaffResponse: vi.fn(),
  getChiefActionTitle: () => 'Executive Summary',
}));

import { generateChiefOfStaffResponse } from '../lib/openai';

describe('src/pages/ChiefOfStaff', () => {
  beforeEach(() => {
    window.localStorage.clear();
    generateChiefOfStaffResponse.mockReset();
  });

  it('blocks generation when notes are empty and does not call the API', () => {
    render(
      <MemoryRouter>
        <ChiefOfStaff />
      </MemoryRouter>,
    );

    const summarizeButton = screen.getByRole('button', { name: 'Generate an executive summary from current notes' });
    const notesField = screen.getByLabelText('Paste notes and context');

    expect(summarizeButton).toBeDisabled();
    expect(notesField).toHaveValue('');

    fireEvent.click(summarizeButton);

    expect(generateChiefOfStaffResponse).not.toHaveBeenCalled();
  });

  it('adds AI output when generation succeeds', async () => {
    generateChiefOfStaffResponse.mockResolvedValue({
      title: 'Executive Summary',
      content: 'Team met objectives and closed 3 opportunities.',
      source: 'proxy',
    });

    render(
      <MemoryRouter>
        <ChiefOfStaff />
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByLabelText('Paste notes and context'), {
      target: { value: 'Team closed all stretch goals this quarter.' },
    });

    const summarizeButton = screen.getByRole('button', { name: 'Generate an executive summary from current notes' });
    fireEvent.click(summarizeButton);

    expect(summarizeButton).toBeDisabled();

    await waitFor(() => {
      expect(screen.getByText('Created: Executive Summary. Review and edit before sending.')).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText('Team met objectives and closed 3 opportunities.')).toBeInTheDocument();
    });

    expect(generateChiefOfStaffResponse).toHaveBeenCalledWith({
      actionKey: 'summarize',
      notes: 'Team closed all stretch goals this quarter.',
    });
  });
});
