import "server-only";
import { canonDb } from "@/lib/canon";

export interface CalendarEvent {
  id: string;
  account_email: string;
  title: string | null;
  start_ts: string | null;
  end_ts: string | null;
  all_day: boolean;
  status: string | null;
  location: string | null;
  html_link: string | null;
}

// Upcoming events across Nick's calendars, next `days` days.
// Source: canon_engine.public.calendar_events (ingested by the gws calendar pipeline).
export async function listUpcomingEvents(days = 7): Promise<CalendarEvent[]> {
  const now = new Date();
  const horizon = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
  const { data, error } = await canonDb()
    .from("calendar_events")
    .select("id,account_email,title,start_ts,end_ts,all_day,status,location,html_link")
    .gte("start_ts", now.toISOString())
    .lte("start_ts", horizon.toISOString())
    .order("start_ts", { ascending: true })
    .limit(25);
  if (error) throw new Error(error.message);
  const rows = (data as CalendarEvent[] | null) ?? [];
  // Meetings this week only: drop cancelled and personal-admin blocks.
  return rows.filter(
    (e) => e.status !== "cancelled" && !/personal\s*admin/i.test(e.title ?? ""),
  );
}
