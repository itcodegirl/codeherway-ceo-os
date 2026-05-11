/**
 * Shared accept-button label for the four Chief of Staff item lists
 * (priorities, opportunities, content drafts, tasks). The pending and
 * accepted labels are identical across all four lists; only the
 * ready-to-accept label varies by destination ("Add to Weekly",
 * "Add to Opportunities", "Add to Content").
 *
 * Centralising this avoids four near-identical helper functions drifting
 * out of sync the next time the saving / accepted copy changes (e.g. for
 * accessibility, localisation, or a tone update).
 */
export function getChiefAcceptLabel({ isAccepting, isAccepted, readyLabel }) {
  if (isAccepting) {
    return 'Saving...';
  }

  if (isAccepted) {
    return 'Added';
  }

  return readyLabel;
}
