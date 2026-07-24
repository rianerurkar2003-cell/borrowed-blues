import { CalendarDays, BookHeart, ClipboardList, User, Home as HomeIcon, LibraryBig } from "lucide-react";

/** Absolute paths — `end: true` on the index so it doesn't match descendants. */
export const CLIENT_NAV = [
  { to: "/portal",              label: "Dashboard",    icon: HomeIcon, end: true },
  { to: "/portal/appointments", label: "Appointments", icon: CalendarDays },
  { to: "/portal/journal",      label: "Journal",      icon: BookHeart },
  { to: "/portal/homework",     label: "Homework",     icon: ClipboardList },
  { to: "/portal/resources",    label: "Resources",    icon: LibraryBig },
  { to: "/portal/profile",      label: "Profile",      icon: User },
];
