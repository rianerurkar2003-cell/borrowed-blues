import { LayoutDashboard, Users, CalendarDays, ClipboardList, LibraryBig, User as UserIcon } from "lucide-react";

/** Absolute paths — `end: true` on the index so it doesn't match descendants. */
export const THERAPIST_NAV = [
  { to: "/therapist",           label: "Dashboard",  icon: LayoutDashboard, end: true },
  { to: "/therapist/clients",   label: "Clients",    icon: Users },
  { to: "/therapist/calendar",  label: "Calendar",   icon: CalendarDays },
  { to: "/therapist/requests",  label: "Requests",   icon: ClipboardList },
  { to: "/therapist/resources", label: "Resources",  icon: LibraryBig },
  { to: "/therapist/profile",   label: "Profile",    icon: UserIcon },
];
