/** Builds a calendar file with a reminder before every period of a circle closes. Works in any calendar app. */
export function circleReminderIcs(opts: {
  circleId: bigint;
  name: string;
  start: number; // unix seconds the circle started
  period: number; // seconds
  url: string;
  count?: number;
}): string {
  const count = opts.count ?? 26;
  const now = Math.floor(Date.now() / 1000);
  const first = Math.max(0, Math.floor((now - opts.start) / opts.period));
  const stamp = toIcsDate(now);
  const events: string[] = [];
  for (let k = first; k < first + count; k++) {
    const close = opts.start + (k + 1) * opts.period;
    const remind = close - Math.min(6 * 3600, Math.floor(opts.period / 4)); // a few hours before it closes
    events.push(
      [
        "BEGIN:VEVENT",
        `UID:equalship-${opts.circleId}-${k}@equalship.vercel.app`,
        `DTSTAMP:${stamp}`,
        `DTSTART:${toIcsDate(remind)}`,
        `DTEND:${toIcsDate(remind + 900)}`,
        `SUMMARY:${escape(`Save in ${opts.name}`)}`,
        `DESCRIPTION:${escape(`Your Equalship period closes soon. Save here: ${opts.url}`)}`,
        `URL:${opts.url}`,
        "BEGIN:VALARM",
        "ACTION:DISPLAY",
        "TRIGGER:-PT0M",
        `DESCRIPTION:${escape(`Save in ${opts.name}`)}`,
        "END:VALARM",
        "END:VEVENT",
      ].join("\r\n"),
    );
  }
  return ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Equalship//Circle reminders//EN", "CALSCALE:GREGORIAN", ...events, "END:VCALENDAR"].join("\r\n");
}

function toIcsDate(unix: number): string {
  return new Date(unix * 1000).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

function escape(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

export function downloadIcs(filename: string, body: string) {
  const blob = new Blob([body], { type: "text/calendar;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
