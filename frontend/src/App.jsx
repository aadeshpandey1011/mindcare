import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";

import Home               from "./pages/Home";
import Signup             from "./pages/Signup";
import Login              from "./pages/Login";
import ForgotPassword     from "./pages/ForgotPassword";
import ResetPassword      from "./pages/ResetPassword";
import GoogleAuthSuccess  from "./pages/GoogleAuthSuccess";
import Newhome            from "./pages/Newhome";
import Dashboard          from "./pages/Dashboard";
import Screening          from "./pages/Screening";
import ChatSupport        from "./pages/ChatSupport";
import Booking            from "./pages/Booking";
import Resources          from "./pages/Resources";
import Forum              from "./pages/Forum";
import AllBookings        from "./pages/AllBookings";
import UserApprovals      from "./pages/UserApproval";
import VerifyIdentity     from "./pages/VerifyIdentity";
import Profile            from "./pages/Profile";
import CounsellorSettings from "./pages/CounsellorSettings";
import AdminUsers         from "./pages/AdminUsers";
import AdminPayouts       from "./pages/AdminPayouts";
import PaymentLogs        from "./pages/PaymentLogs";
import Journal            from "./pages/Journal";
import PrivacyPolicy      from "./pages/PrivacyPolicy";

import Layout             from "./components/Layout";
import ProtectedRoute     from "./components/ProtectedRoute";
import BookingDashboard   from "./components/BookingDashboard";

// ── Booking page smart redirect ────────────────────────────────────────────────
function BookingOrRedirect() {
  const { user } = useAuth();
  if (user?.role === "admin")      return <Navigate to="/dashboard"            replace />;
  if (user?.role === "counsellor") return <Navigate to="/counsellorDashboard"  replace />;
  return <Booking />;
}

function App() {
  return (
    <Routes>

      {/* ── Fully public ── */}
      <Route path="/"                      element={<Home />} />
      <Route path="/login"                 element={<Login />} />
      <Route path="/signup"                element={<Signup />} />
      <Route path="/forgot-password"       element={<ForgotPassword />} />
      <Route path="/reset-password/:token" element={<ResetPassword />} />
      <Route path="/auth/google/success"   element={<GoogleAuthSuccess />} />
      <Route path="/privacy"               element={<PrivacyPolicy />} />

      {/* ── Protected inside Layout (with Navbar) ── */}
      <Route element={<Layout />}>

        <Route path="/newhome" element={<Newhome />} />

        {/* All authenticated roles */}
        <Route path="/profile" element={
          <ProtectedRoute allowedRoles={["student", "counsellor", "admin"]}>
            <Profile />
          </ProtectedRoute>
        } />
        <Route path="/screening" element={
          <ProtectedRoute allowedRoles={["student", "counsellor", "admin"]}>
            <Screening />
          </ProtectedRoute>
        } />
        <Route path="/chat" element={
          <ProtectedRoute allowedRoles={["student", "counsellor", "admin"]}>
            <ChatSupport />
          </ProtectedRoute>
        } />
        <Route path="/resources" element={
          <ProtectedRoute allowedRoles={["student", "counsellor", "admin"]}>
            <Resources />
          </ProtectedRoute>
        } />
        <Route path="/forum" element={
          <ProtectedRoute allowedRoles={["student", "counsellor", "admin"]}>
            <Forum />
          </ProtectedRoute>
        } />
        <Route path="/verify-identity" element={
          <ProtectedRoute allowedRoles={["student", "counsellor", "admin"]}>
            <VerifyIdentity />
          </ProtectedRoute>
        } />

        {/* Journal — student + counsellor */}
        <Route path="/journal" element={
          <ProtectedRoute allowedRoles={["student", "counsellor"]}>
            <Journal />
          </ProtectedRoute>
        } />

        {/* Book Appointment */}
        <Route path="/booking" element={
          <ProtectedRoute allowedRoles={["student", "counsellor", "admin"]}>
            <BookingOrRedirect />
          </ProtectedRoute>
        } />

        {/* Student only */}
        <Route path="/all-bookings" element={
          <ProtectedRoute allowedRoles={["student"]}>
            <AllBookings />
          </ProtectedRoute>
        } />
        <Route path="/my-payments" element={
          <ProtectedRoute allowedRoles={["student", "counsellor"]}>
            <PaymentLogs />
          </ProtectedRoute>
        } />

        {/* Counsellor only */}
        <Route path="/counsellorDashboard" element={
          <ProtectedRoute allowedRoles={["counsellor"]}>
            <BookingDashboard />
          </ProtectedRoute>
        } />
        <Route path="/counsellor-settings" element={
          <ProtectedRoute allowedRoles={["counsellor"]}>
            <CounsellorSettings />
          </ProtectedRoute>
        } />

        {/* Admin only */}
        <Route path="/dashboard" element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <Dashboard />
          </ProtectedRoute>
        } />
        <Route path="/approvals" element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <UserApprovals />
          </ProtectedRoute>
        } />
        <Route path="/admin/users" element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminUsers />
          </ProtectedRoute>
        } />
        <Route path="/admin/payments" element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <PaymentLogs />
          </ProtectedRoute>
        } />
        <Route path="/admin/payouts" element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminPayouts />
          </ProtectedRoute>
        } />

        {/* Catch-all inside layout */}
        <Route path="*" element={<Navigate to="/newhome" />} />
      </Route>

    </Routes>
  );
}

export default App;
