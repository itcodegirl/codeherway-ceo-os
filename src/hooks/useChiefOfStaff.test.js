import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useChiefOfStaff } from './useChiefOfStaff';

vi.mock('../lib/openai', () => ({
  aiConfig: {
    hasProxyEndpoint: true,
    endpoint: '/api/chief-of-staff',
    configuredEndpoint: '/api/chief-of-staff',
  },
  generateChiefOfStaffResponse: vi.fn(),
  getChiefActionTitle: vi.fn((actionKey) => `${actionKey} title`),
}));

vi.mock('../lib/opportunitiesRepository', () => ({
  createOpportunity: vi.fn(),
  listOpportunities: vi.fn(),
}));

vi.mock('../lib/contentRepository', () => ({
  createContentItem: vi.fn(),
  listContentItems: vi.fn(),
}));

vi.mock('../lib/weeklyRepository', () => ({
  createWeeklyItem: vi.fn(),
  getCurrentWeekStart: vi.fn(() => '2026-04-20'),
  getWeeklyBriefByWeek: vi.fn(() => Promise.resolve({ priorities: [] })),
}));

vi.mock('../lib/chiefRepository', () => ({
  createChiefSession: vi.fn(),
  getChiefSource: vi.fn(() => 'local'),
  loadChiefWorkspace: vi.fn(() => ({
    notes: 'Initial notes',
    responses: [],
    source: 'local',
  })),
  resetChiefWorkspace: vi.fn(),
  saveChiefNotes: vi.fn(() => Promise.resolve('')),
  saveChiefOutput: vi.fn(),
}));

import { createOpportunity, listOpportunities } from '../lib/opportunitiesRepository';
import { listContentItems } from '../lib/contentRepository';
import { createChiefSession, loadChiefWorkspace, saveChiefOutput } from '../lib/chiefRepository';
import { generateChiefOfStaffResponse } from '../lib/openai';

describe('useChiefOfStaff', () => {
  let originalRequestAnimationFrame;
  let originalCancelAnimationFrame;

  beforeEach(() => {
    vi.clearAllMocks();

    originalRequestAnimationFrame = window.requestAnimationFrame;
    originalCancelAnimationFrame = window.cancelAnimationFrame;
    window.requestAnimationFrame = vi.fn((callback) => {
      callback(0);
      return 11;
    });
    window.cancelAnimationFrame = vi.fn();
  });

  afterEach(() => {
    window.requestAnimationFrame = originalRequestAnimationFrame;
    window.cancelAnimationFrame = originalCancelAnimationFrame;
  });

  it('hydrates acceptance state for already persisted structured opportunities', async () => {
    listOpportunities.mockResolvedValue([
      {
        id: 'o-1',
        name: 'Acme Intro',
        company: 'Acme',
      },
    ]);

    const { result } = renderHook(() => useChiefOfStaff());

    await waitFor(() => {
      expect(loadChiefWorkspace).toHaveBeenCalledTimes(1);
    });

    await act(async () => {
      await result.current.acceptStructuredItem('opportunities', {
        name: 'Acme Intro',
        company: 'Acme',
      });
    });

    expect(createOpportunity).not.toHaveBeenCalled();
    expect(result.current.feedback).toBe('That opportunity already exists.');
    expect(result.current.isStructuredItemAccepted('opportunities', {
      name: 'Acme Intro',
      company: 'Acme',
    })).toBe(true);
  });

  it('adds a structured fallback output to local responses when proxy returns fallback source', async () => {
    createChiefSession.mockResolvedValue({ id: 'session-1' });
    listOpportunities.mockResolvedValue([]);
    listContentItems.mockResolvedValue([]);
    saveChiefOutput.mockResolvedValue({
      id: 'output-1',
      title: 'summarize title',
      content: 'Fallback executive summary',
      source: 'fallback',
      structuredPayload: {
        priorities: [],
        opportunities: [],
        contentItems: [],
        tasks: [],
      },
    });
    generateChiefOfStaffResponse.mockResolvedValue({
      title: 'summarize title',
      content: 'Fallback executive summary',
      source: 'fallback',
      structuredPayload: {
        priorities: [],
        opportunities: [],
        contentItems: [],
        tasks: [],
      },
    });

    const { result } = renderHook(() => useChiefOfStaff());

    await waitFor(() => {
      expect(loadChiefWorkspace).toHaveBeenCalledTimes(1);
    });

    act(() => {
      result.current.setNotes('Status update: closed 3 opportunities');
    });

    await act(async () => {
      await result.current.handleAction('summarize');
    });

    await waitFor(() => {
      expect(result.current.responses[0]).toMatchObject({
        id: 'output-1',
        content: 'Fallback executive summary',
      });
    });
    expect(generateChiefOfStaffResponse).toHaveBeenCalledWith({
      actionKey: 'summarize',
      notes: 'Status update: closed 3 opportunities',
    });
    expect(createChiefSession).toHaveBeenCalledWith({
      actionKey: 'summarize',
      notes: 'Status update: closed 3 opportunities',
    });
    expect(saveChiefOutput).toHaveBeenCalledWith(expect.objectContaining({
      sessionId: 'session-1',
      outputType: 'response',
      title: 'summarize title',
      content: 'Fallback executive summary',
      source: 'fallback',
    }));
    expect(result.current.feedback).toBe('Created: summarize title. Using local fallback output.');
    expect(result.current.hasHistory).toBe(true);
  });
});
