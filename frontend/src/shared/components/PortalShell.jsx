import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "@/state/AuthContext";
import { LOGO_URL } from "@/components/Watercolor";
import { LogOut } from "lucide-react";

/**
 * Shared shell for the Client and Therapist portals. Both portals share the
 * same layout (sidebar + logo + nav + user info + logout, plus a mobile
 * header/pill bar and a max-width main). Only the theme and nav data differ.
 *
 * Props:
 *   theme:         "light" (client) | "dark" (therapist)
 *   nav:           [{ to, label, icon, end? }]
 *   navTestIdPrefix / logoutTestId / portalTestId : test id conventions
 *   eyebrowLabel:  small caps text above the nav ("Your portal" / "Your practice")
 *   roleLabel:     user-role label under the initials
 *   children:      routed content
 */
export default function PortalShell({
  theme = "light",
  nav,
  navTestIdPrefix,
  logoutTestId,
  portalTestId,
  eyebrowLabel,
  roleLabel,
  children,
}) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const initials = (user?.name || "").split(" ").map((s) => s[0]).filter(Boolean).slice(0, 2).join("");
  const isDark = theme === "dark";

  const asideBg      = isDark ? "bg-bb-forest text-bb-cream" : "bg-bb-warm";
  const asideBorder  = isDark ? "border-r border-bb-moss/60" : "border-r border-bb-moss/60";
  const eyebrowText  = isDark ? "text-bb-cream/70" : "text-bb-teal";
  const linkActive   = isDark ? "bg-bb-teal/40 text-bb-cream" : "bg-bb-moss/70 text-bb-forest";
  const linkIdle     = isDark ? "text-bb-cream/70 hover:bg-bb-teal/20" : "text-bb-forest/70 hover:text-bb-forest hover:bg-bb-moss/40";
  const dividerTop   = isDark ? "border-t border-bb-cream/15" : "border-t border-bb-moss/60";
  const initialsBg   = isDark ? "bg-bb-cream text-bb-forest" : "bg-bb-forest text-bb-cream";
  const roleTextDim  = isDark ? "text-bb-cream/60" : "text-bb-forest/60";
  const nameText     = isDark ? "text-bb-cream" : "text-bb-forest";
  const signoutText  = isDark ? "text-bb-cream/70 hover:text-bb-cream" : "text-bb-forest/70 hover:text-bb-forest";
  const logoStyle    = isDark ? { filter: "invert(1)" } : undefined;
  const mobileHeader = isDark ? "bg-bb-forest text-bb-cream" : "bg-bb-cream/95 backdrop-blur border-b border-bb-moss/60";
  const mobileHeaderText = isDark ? "text-bb-cream/80" : "text-bb-forest/70";

  const doSignOut = async () => {
    // Navigate to Home BEFORE flipping auth state, otherwise <ProtectedRoute>
    // (which wraps this shell) will synchronously redirect to /login the
    // moment `user` becomes false, winning the race against navigate('/').
    navigate("/", { replace: true });
    await logout();
  };

  return (
    <div className={`min-h-screen bg-bb-cream flex`} data-testid={portalTestId}>
      {/* Desktop sidebar */}
      <aside className={`w-[248px] shrink-0 hidden md:flex flex-col ${asideBorder} ${asideBg} px-6 py-8`}>
        <Link to="/" className="flex items-center mb-10">
          <img src={LOGO_URL} alt="Borrowed Blues" className="h-11 w-auto" style={logoStyle} draggable={false} />
        </Link>
        <p className={`bb-eyebrow ${eyebrowText} mb-3`}>{eyebrowLabel}</p>
        <nav className="flex flex-col gap-1">
          {nav.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={!!end}
              data-testid={`${navTestIdPrefix}-${label.toLowerCase()}`}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-[14.5px] transition-colors ${isActive ? linkActive : linkIdle}`
              }
            >
              {Icon ? <Icon size={17} strokeWidth={1.5} /> : null} {label}
            </NavLink>
          ))}
        </nav>
        <div className={`mt-auto pt-6 ${dividerTop}`}>
          <div className="flex items-center gap-3 mb-3">
            <div className={`w-9 h-9 rounded-full ${initialsBg} grid place-items-center text-sm font-serif`}>{initials || "•"}</div>
            <div>
              <p className={`text-sm ${nameText}`}>{user?.name}</p>
              <p className={`text-xs ${roleTextDim}`}>{roleLabel}</p>
            </div>
          </div>
          <button
            onClick={doSignOut}
            data-testid={logoutTestId}
            className={`flex items-center gap-2 text-sm ${signoutText}`}
          >
            <LogOut size={15} /> Sign out
          </button>
        </div>
      </aside>

      <div className="flex-1 min-w-0">
        {/* Mobile header */}
        <header className={`md:hidden sticky top-0 z-30 ${mobileHeader} px-6 py-4 flex items-center justify-between`}>
          <Link to="/" className="font-serif">Borrowed Blues</Link>
          <button onClick={doSignOut} className={`text-sm ${mobileHeaderText}`}>Sign out</button>
        </header>
        {/* Mobile pill nav */}
        <div className="md:hidden overflow-x-auto bb-scroll-x border-b border-bb-moss/60 bg-bb-warm px-4 py-2 flex gap-1">
          {nav.map(({ to, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={!!end}
              className={({ isActive }) =>
                `px-3 py-2 rounded-full text-xs whitespace-nowrap ${isActive ? "bg-bb-forest text-bb-cream" : "text-bb-forest/70"}`
              }
            >
              {label}
            </NavLink>
          ))}
        </div>
        <main className="p-6 md:p-10 lg:p-14 max-w-[1240px]">{children}</main>
      </div>
    </div>
  );
}
