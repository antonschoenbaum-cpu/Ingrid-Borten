import { EventsAdmin } from "./events-admin";
import { getEvents } from "@/lib/data";

export default async function AdminEventsPage() {
  const items = await getEvents();
  return (
    <EventsAdmin
      key={items
        .map((e) => `${e.id}:${e.start_date}:${e.end_date}:${e.title}:${e.image ?? ""}`)
        .join("|")}
      initial={items}
    />
  );
}
