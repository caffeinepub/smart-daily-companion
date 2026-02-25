/** Convert bigint minutes-since-midnight to "8:00 AM" format */
export function minutesToTime(minutes: bigint): string {
  const m = Number(minutes);
  const h = Math.floor(m / 60);
  const min = m % 60;
  const period = h >= 12 ? "PM" : "AM";
  const displayH = h % 12 || 12;
  return `${displayH}:${String(min).padStart(2, "0")} ${period}`;
}

/** Convert bigint minutes to "1h 30m" format */
export function minutesToDuration(minutes: bigint): string {
  const m = Number(minutes);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  const rem = m % 60;
  if (rem === 0) return `${h}h`;
  return `${h}h ${rem}m`;
}

/** Convert "HH:MM" time string to bigint minutes since midnight */
export function timeStringToMinutes(timeStr: string): bigint {
  const [h, m] = timeStr.split(":").map(Number);
  return BigInt(h * 60 + m);
}

/** Convert bigint minutes to "HH:MM" for input[type=time] */
export function minutesToTimeInput(minutes: bigint): string {
  const m = Number(minutes);
  const h = Math.floor(m / 60);
  const min = m % 60;
  return `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
}

/** Get today's date as YYYY-MM-DD */
export function getTodayString(): string {
  return new Date().toISOString().split("T")[0];
}

/** Get greeting based on current hour */
export function getGreeting(name?: string): string {
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  return name ? `${greeting}, ${name}!` : `${greeting}!`;
}

/** Check if it's evening (after 5 PM) */
export function isEvening(): boolean {
  return new Date().getHours() >= 17;
}

/** Format date for display: "Wednesday, Feb 25" */
export function formatDisplayDate(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}

/** Get last 7 days as YYYY-MM-DD strings (oldest first) */
export function getLast7Days(): string[] {
  const days: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().split("T")[0]);
  }
  return days;
}

/** Short day label: "M", "T", "W", "T", "F", "S", "S" */
export function getDayLabel(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return ["S", "M", "T", "W", "T", "F", "S"][d.getDay()];
}
