import { useCallback, useEffect, useRef, useState } from 'react';
import { CAPTURE_NOTES_UPDATED_EVENT, listCaptureNotes } from '../lib/captureRepository';
import {
  getJournalEntryByDate,
  getTodayJournalDateKey,
  JOURNAL_ENTRIES_UPDATED_EVENT,
} from '../lib/journalRepository';
import { CONTENT_ITEMS_UPDATED_EVENT, listContentItems } from '../lib/contentRepository';
import { OPPORTUNITIES_UPDATED_EVENT, listOpportunities } from '../lib/opportunitiesRepository';
import { REMINDERS_UPDATED_EVENT, listReminders } from '../lib/remindersRepository';
import { buildDeterministicSuggestions } from '../lib/suggestions';
import {
  getCurrentWeekStart,
  getWeeklyBriefByWeek,
  WEEKLY_BRIEF_UPDATED_EVENT,
} from '../lib/weeklyRepository';

function buildPulseItems({
  priorities,
  blockers,
  wins,
  opportunities,
  captureNotes,
  reminders,
}) {
  const focusCount = priorities.filter((item) => item?.status === 'In Progress' || item?.status === 'Planned').length;
  const momentumCount = wins.length + opportunities.filter((item) => item?.stage === 'In Progress').length;
  const blockerCount = blockers.length;
  const ideaCount = captureNotes.filter((item) => item?.category === 'idea').length;
  const resetCount = reminders.filter((item) => !item?.isDone).length;

  return [
    {
      id: 'focus',
      label: 'Focus',
      value: String(focusCount),
      tone: focusCount > 0 ? 'positive' : 'neutral',
    },
    {
      id: 'momentum',
      label: 'Momentum',
      value: String(momentumCount),
      tone: momentumCount > 0 ? 'positive' : 'neutral',
    },
    {
      id: 'blockers',
      label: 'Blockers',
      value: String(blockerCount),
      tone: blockerCount > 0 ? 'warning' : 'neutral',
    },
    {
      id: 'ideas',
      label: 'Ideas',
      value: String(ideaCount),
      tone: ideaCount > 0 ? 'positive' : 'neutral',
    },
    {
      id: 'reset',
      label: 'Reset',
      value: String(resetCount),
      tone: resetCount > 0 ? 'warning' : 'neutral',
    },
  ];
}

const DEFAULT_PULSE_ITEMS = [
  { id: 'focus', label: 'Focus', value: '--', tone: 'neutral' },
  { id: 'momentum', label: 'Momentum', value: '--', tone: 'neutral' },
  { id: 'blockers', label: 'Blockers', value: '--', tone: 'neutral' },
  { id: 'ideas', label: 'Ideas', value: '--', tone: 'neutral' },
  { id: 'reset', label: 'Reset', value: '--', tone: 'neutral' },
];

export function useSystemPulse() {
  const [pulse, setPulse] = useState({
    isLoading: true,
    items: DEFAULT_PULSE_ITEMS,
    nextMove: 'Syncing command signal...',
  });
  const requestIdRef = useRef(0);

  const loadPulse = useCallback(async () => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    try {
      const [opportunities, contentRows, weekly] = await Promise.all([
        listOpportunities(),
        listContentItems(),
        getWeeklyBriefByWeek(getCurrentWeekStart()),
      ]);
      const captureNotes = listCaptureNotes();
      const reminders = listReminders();
      const journalEntry = getJournalEntryByDate(getTodayJournalDateKey());

      if (requestId !== requestIdRef.current) {
        return;
      }

      const priorities = Array.isArray(weekly?.priorities) ? weekly.priorities : [];
      const blockers = Array.isArray(weekly?.blockers) ? weekly.blockers : [];
      const wins = Array.isArray(weekly?.wins) ? weekly.wins : [];
      const suggestions = buildDeterministicSuggestions({
        priorities,
        blockers,
        opportunities,
        contentRows,
        notes: captureNotes,
        reminders,
        journalEntry,
      });
      const items = buildPulseItems({
        priorities,
        blockers,
        wins,
        opportunities,
        captureNotes,
        reminders,
      });

      setPulse({
        isLoading: false,
        items,
        nextMove: suggestions[0]?.text || 'You are clear for now. Keep one tiny action in motion.',
      });
    } catch {
      if (requestId !== requestIdRef.current) {
        return;
      }

      setPulse({
        isLoading: false,
        items: [
          ...DEFAULT_PULSE_ITEMS,
        ],
        nextMove: 'Unable to refresh command signal right now.',
      });
    }
  }, []);

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      loadPulse();
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [loadPulse]);

  useEffect(() => {
    const handleAnyDataUpdate = () => {
      loadPulse();
    };

    window.addEventListener(OPPORTUNITIES_UPDATED_EVENT, handleAnyDataUpdate);
    window.addEventListener(CONTENT_ITEMS_UPDATED_EVENT, handleAnyDataUpdate);
    window.addEventListener(WEEKLY_BRIEF_UPDATED_EVENT, handleAnyDataUpdate);
    window.addEventListener(CAPTURE_NOTES_UPDATED_EVENT, handleAnyDataUpdate);
    window.addEventListener(JOURNAL_ENTRIES_UPDATED_EVENT, handleAnyDataUpdate);
    window.addEventListener(REMINDERS_UPDATED_EVENT, handleAnyDataUpdate);

    return () => {
      window.removeEventListener(OPPORTUNITIES_UPDATED_EVENT, handleAnyDataUpdate);
      window.removeEventListener(CONTENT_ITEMS_UPDATED_EVENT, handleAnyDataUpdate);
      window.removeEventListener(WEEKLY_BRIEF_UPDATED_EVENT, handleAnyDataUpdate);
      window.removeEventListener(CAPTURE_NOTES_UPDATED_EVENT, handleAnyDataUpdate);
      window.removeEventListener(JOURNAL_ENTRIES_UPDATED_EVENT, handleAnyDataUpdate);
      window.removeEventListener(REMINDERS_UPDATED_EVENT, handleAnyDataUpdate);
    };
  }, [loadPulse]);

  return pulse;
}
