// Generează un fișier .ics (calendar) care poate fi atașat în email.
// Merge cu Google Calendar, Outlook, Apple Calendar etc.

function fmtUTC(date) {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

function esc(text = '') {
  return String(text)
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

export function buildIcs({ title, description, start, durationMinutes, url, uid }) {
  const startDate = new Date(start);
  const endDate = new Date(startDate.getTime() + durationMinutes * 60000);
  const now = new Date();

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Aula//Meetings//RO',
    'CALSCALE:GREGORIAN',
    'METHOD:REQUEST',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${fmtUTC(now)}`,
    `DTSTART:${fmtUTC(startDate)}`,
    `DTEND:${fmtUTC(endDate)}`,
    `SUMMARY:${esc(title)}`,
    `DESCRIPTION:${esc(description)}`,
    `LOCATION:${esc(url)}`,
    `URL:${url}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ];

  return lines.join('\r\n');
}
