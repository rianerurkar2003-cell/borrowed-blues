import { Routes, Route, Navigate } from "react-router-dom";
import PortalShell from "@/shared/components/PortalShell";
import { THERAPIST_NAV } from "@/features/therapist/nav";
import TherapistDashboard from "@/features/therapist/TherapistDashboard";
import Clients from "@/features/therapist/Clients";
import CalendarView from "@/features/therapist/CalendarView";
import Requests from "@/features/therapist/Requests";
import TherapistResources from "@/features/therapist/TherapistResources";
import TherapistProfile from "@/features/therapist/TherapistProfile";

/**
 * Therapist portal router. Sub-routes live in sibling files; the shell
 * (nav, logo, logout, mobile bar) is shared via <PortalShell>.
 */
export default function TherapistPortal() {
  return (
    <PortalShell
      theme="dark"
      nav={THERAPIST_NAV}
      navTestIdPrefix="therapist-nav"
      logoutTestId="therapist-logout"
      portalTestId="therapist-portal"
      eyebrowLabel="Your practice"
      roleLabel="Therapist"
    >
      <Routes>
        <Route index element={<TherapistDashboard />} />
        <Route path="clients"   element={<Clients />} />
        <Route path="calendar"  element={<CalendarView />} />
        <Route path="requests"  element={<Requests />} />
        <Route path="resources" element={<TherapistResources />} />
        <Route path="profile"   element={<TherapistProfile />} />
        <Route path="*" element={<Navigate to="" replace />} />
      </Routes>
    </PortalShell>
  );
}
