import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { BirdFlock, LOGO_URL } from "@/components/Watercolor";
import { Menu, X } from "lucide-react";

const NAV = [
  { to: "/",                 label: "Home" },
  { to: "/about-therapy",    label: "About therapy" },
  { to: "/meet-your-therapist", label: "Meet your therapist" },
  { to: "/resources",        label: "Resources" },
];

function Logo({ className = "" }) {
  return (
    <Link to="/" data-testid="bb-logo" className={`inline-flex items-center ${className}`}>
      <img src={LOGO_URL} alt="Borrowed Blues" className="h-10 md:h-11 w-auto select-none" draggable={false} />
    </Link>
  );
}

function Header() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const [open, setOpen] = useState(false);

  const portalHref = user && user.role === "therapist" ? "/therapist" : "/portal";

  return (
    <header
      data-testid="public-header"
      className="sticky top-0 z-40 backdrop-blur-md bg-bb-cream/85 border-b border-bb-moss/50"
    >
      <div className="bb-container flex items-center justify-between h-[76px]">
        <Logo />
        <nav className="hidden md:flex items-center gap-9">
          {NAV.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              data-testid={`nav-${n.label.toLowerCase().replace(/\s+/g, "-")}`}
              className={({ isActive }) =>
                `text-[14.5px] tracking-wide transition-colors ${
                  isActive ? "text-bb-forest" : "text-bb-forest/70 hover:text-bb-forest"
                }`
              }
              end={n.to === "/"}
            >
              {n.label}
            </NavLink>
          ))}
        </nav>
        <div className="hidden md:flex items-center gap-3">
          {user && user.role ? (
            <>
              <Link
                to={portalHref}
                data-testid="nav-portal"
                className="px-5 py-2 rounded-full text-sm bg-bb-forest text-bb-cream hover:bg-bb-forest-2 transition-colors"
              >
                My {user.role === "therapist" ? "practice" : "portal"}
              </Link>
              <button
                data-testid="nav-logout"
                onClick={async () => { await logout(); nav("/"); }}
                className="text-sm text-bb-forest/70 hover:text-bb-forest"
              >
                Sign out
              </button>
            </>
          ) : (
            <Link
              to="/login"
              data-testid="nav-login"
              className="px-5 py-2 rounded-full text-sm bg-bb-forest text-bb-cream hover:bg-bb-forest-2 transition-colors"
            >
              Client login
            </Link>
          )}
        </div>
        <button
          data-testid="mobile-menu-toggle"
          onClick={() => setOpen((v) => !v)}
          className="md:hidden p-2 text-bb-forest"
          aria-label="Toggle menu"
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>
      {open && (
        <div className="md:hidden border-t border-bb-moss/60 bg-bb-cream">
          <div className="bb-container py-6 flex flex-col gap-5">
            {NAV.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                onClick={() => setOpen(false)}
                className="text-bb-forest/80 text-[15px]"
              >
                {n.label}
              </NavLink>
            ))}
            <Link
              to={user && user.role ? portalHref : "/login"}
              onClick={() => setOpen(false)}
              className="mt-2 inline-flex justify-center px-5 py-3 rounded-full bg-bb-forest text-bb-cream text-sm"
            >
              {user && user.role ? "Enter portal" : "Client login"}
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}

function Footer() {
  return (
    <footer data-testid="public-footer" className="mt-24 border-t border-bb-moss/60 bg-bb-cream">
      <div className="bb-container py-16 grid md:grid-cols-4 gap-10">
        <div className="md:col-span-2">
          <Logo />
          <p className="mt-5 text-bb-forest/70 max-w-md leading-relaxed">
            A quiet companion for the work between sessions. Borrowed Blues is a
            private practice built around clarity, care, and continuity.
          </p>
          <BirdFlock className="mt-6 w-40 opacity-70" />
        </div>
        <div>
          <p className="bb-eyebrow mb-4">Explore</p>
          <ul className="space-y-3 text-bb-forest/75">
            <li><Link to="/about-therapy" className="hover:text-bb-forest">About therapy</Link></li>
            <li><Link to="/meet-your-therapist" className="hover:text-bb-forest">Meet your therapist</Link></li>
            <li><Link to="/resources" className="hover:text-bb-forest">Resources</Link></li>
            <li><Link to="/login" className="hover:text-bb-forest">Client login</Link></li>
          </ul>
        </div>
        <div>
          <p className="bb-eyebrow mb-4">A note</p>
          <p className="text-bb-forest/70 text-sm leading-relaxed">
            If you are in crisis, please contact your local emergency services or
            a helpline in your region. Borrowed Blues is a supportive practice —
            not an emergency service.
          </p>
        </div>
      </div>
      <div className="bb-container py-6 border-t border-bb-moss/60 flex flex-col md:flex-row items-center justify-between gap-2 text-xs text-bb-forest/50">
        <span>© {new Date().getFullYear()} Borrowed Blues. Made with care.</span>
        <span className="bb-italic-serif">Slow down. You are here.</span>
      </div>
    </footer>
  );
}

export default function PublicLayout({ children }) {
  return (
    <div className="min-h-screen flex flex-col bg-bb-cream">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
