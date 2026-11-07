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
