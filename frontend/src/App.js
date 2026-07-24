import { lazy, Suspense, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider, useAuth } from "@/state/AuthContext";
import ProtectedRoute from "@/shared/components/ProtectedRoute";
import ErrorBoundary from "@/shared/components/ErrorBoundary";
import PublicLayout from "@/components/PublicLayout";
import Home from "@/pages/Home";
import Login from "@/pages/Login";
import "@/App.css";

// Code-split heavier pages so the initial bundle stays lean.
const AboutTherapy    = lazy(() => import("@/pages/AboutTherapy"));
const MeetTherapist   = lazy(() => import("@/pages/MeetTherapist"));
const PublicResources = lazy(() => import("@/pages/Resources"));
const ClientPortal    = lazy(() => import("@/features/client"));
const TherapistPortal = lazy(() => import("@/features/therapist"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { refetchOnWindowFocus: false, staleTime: 30_000, retry: 1 },
  },
});

function PortalFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-bb-cream">
      <div className="bb-italic-serif text-bb-teal text-lg">A quiet moment…</div>
    </div>
  );
}

function ScrollToTop() {
  useEffect(() => { window.scrollTo(0, 0); }, []);
  return null;
}

function Public({ children }) {
  return (
    <>
      <ScrollToTop />
      <PublicLayout>{children}</PublicLayout>
    </>
  );
}

function AutoRedirect() {
  const { user } = useAuth();
  if (user === null) return <PortalFallback />;
  if (user && user.role === "therapist") return <Navigate to="/therapist" replace />;
  if (user && user.role === "client") return <Navigate to="/portal" replace />;
  return <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <div className="App" data-testid="app-root">
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <BrowserRouter>
              <Suspense fallback={<PortalFallback />}>
                <Routes>
                  <Route path="/"                    element={<Public><Home /></Public>} />
                  <Route path="/about-therapy"       element={<Public><AboutTherapy /></Public>} />
                  <Route path="/meet-your-therapist" element={<Public><MeetTherapist /></Public>} />
                  <Route path="/resources"           element={<Public><PublicResources /></Public>} />
                  <Route path="/login"               element={<Login />} />

                  <Route
                    path="/portal/*"
                    element={
                      <ProtectedRoute role="client">
                        <ClientPortal />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/therapist/*"
                    element={
                      <ProtectedRoute role="therapist">
                        <TherapistPortal />
                      </ProtectedRoute>
                    }
                  />

                  <Route path="/dashboard" element={<AutoRedirect />} />
                  <Route path="*"          element={<Navigate to="/" replace />} />
                </Routes>
              </Suspense>
              <Toaster position="top-center" richColors closeButton />
            </BrowserRouter>
          </AuthProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    </div>
  );
}
