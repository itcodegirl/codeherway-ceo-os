// Shared configuration constants for the Chief of Staff workflow.
//
// Both the client (`src/pages/ChiefOfStaff.jsx`) and the server proxy
// (`server/chiefOfStaffProxyCore.js`) need to agree on the notes-length
// limit. If they ever disagreed, the client could let the user type more
// than the server accepts and the server would silently truncate the
// extra characters without any signal to the user. Defining the limit
// here is the single source of truth.

export const MAX_NOTES_LENGTH = 12000;
