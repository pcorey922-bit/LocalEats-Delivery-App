export function openAt(
  hours: Array<{
    weekday: number;
    openTime: string | null;
    closeTime: string | null;
    isClosed: boolean;
  }>,
  now = new Date(),
) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const value = (key: string) => parts.find((p) => p.type === key)?.value ?? "";
  const weekday = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(
    value("weekday"),
  );
  const row = hours.find((h) => h.weekday === weekday);
  const time = `${value("hour")}:${value("minute")}`;
  return Boolean(
    row &&
    !row.isClosed &&
    row.openTime &&
    row.closeTime &&
    time >= row.openTime.slice(0, 5) &&
    time < row.closeTime.slice(0, 5),
  );
}

export function orderingAvailabilityIssue(
  acceptingOrders: boolean,
  hours: Parameters<typeof openAt>[0],
  now = new Date(),
) {
  if (!acceptingOrders) return 'Restaurant has paused order acceptance. Please try again after the restaurant resumes accepting orders.';
  if (!hours.length)
    return 'Restaurant has not configured its opening hours.';
  if (!openAt(hours, now)) return 'Restaurant is closed. Opening hours use Eastern time (America/New_York). Please try again during its operating hours.';
  return null;
}
