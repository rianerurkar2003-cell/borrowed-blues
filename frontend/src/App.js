import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import PublicLayout from "@/components/PublicLayout";
import Home from "@/pages/Home";
import AboutTherapy from "@/pages/AboutTherapy";
import MeetTherapist from "@/pages/MeetTherapist";
import Resources from "@/pages/Resources";
import Login from "@/pages/Login";
import ClientPortal from "@/pages/ClientPortal";
import TherapistPortal from "@/pages/TherapistPortal";
import "@/App.css";

function ScrollToTop() {
  useEffect(() => { window.scrollTo(0, 0); }, []);
  return null;
}

function AutoRedirect() {
  const { user } = useAuth();
  if (user === null) return null;
  if (user && user.role === "therapist") return <Navigate to="/therapist" replace />;
  if (user && user.role === "client") return <Navigate to="/portal" replace />;
  return <Navigate to="/login" replace />;
}

function Public({ children }) {
  return (
    <>
      <ScrollToTop />
      <PublicLayout>{children}</PublicLayout>
    </>
  );
}

export default function App() {
  return (
    <div className="App" data-testid="app-root">
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Public><Home /></Public>} />
            <Route path="/about-therapy" element={<Public><AboutTherapy /></Public>} />
            <Route path="/meet-your-therapist" element={<Public><MeetTherapist /></Public>} />
            <Route path="/resources" element={<Public><Resources /></Public>} />
            <Route path="/login" element={<Login />} />

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
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <Toaster position="top-center" richColors closeButton />
        </BrowserRouter>
      </AuthProvider>
    </div>
  );
}
