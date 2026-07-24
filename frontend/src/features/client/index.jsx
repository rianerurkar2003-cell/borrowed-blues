import { Routes, Route, Navigate } from "react-router-dom";
import PortalShell from "@/shared/components/PortalShell";
import { CLIENT_NAV } from "@/features/client/nav";
import ClientDashboard from "@/features/client/ClientDashboard";
import Appointments from "@/features/client/Appointments";
import Journal from "@/features/client/Journal";
import Homework from "@/features/client/Homework";
import ClientResources from "@/features/client/ClientResources";
import ClientProfile from "@/features/client/ClientProfile";

/**
 * Client portal router. The shell (nav / logo / logout / mobile bar) is
 * shared with the therapist portal via <PortalShell>.
 */
export default function ClientPortal() {
  return (
    <PortalShell
      theme="light"
      nav={CLIENT_NAV}
      navTestIdPrefix="client-nav"
      logoutTestId="client-logout"
      portalTestId="client-portal"
      eyebrowLabel="Your portal"
      roleLabel="Client"
    >
      <Routes>
        <Route index element={<ClientDashboard />} />
        <Route path="appointments" element={<Appointments />} />
        <Route path="journal" element={<Journal />} />
        <Route path="homework" element={<Homework />} />
        <Route path="resources" element={<ClientResources />} />
        <Route path="profile" element={<ClientProfile />} />
        <Route path="*" element={<Navigate to="" replace />} />
      </Routes>
    </PortalShell>
  );
}
