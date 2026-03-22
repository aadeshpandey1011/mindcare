import { Routes, Route, Navigate } from "react-router-dom";

import Home             from "./pages/Home";
import Signup           from "./pages/Signup";
import Login            from "./pages/Login";
import Newhome          from "./pages/Newhome";
import Dashboard        from "./pages/Dashboard";
import Screening        from "./pages/Screening";
import ChatSupport      from "./pages/ChatSupport";
import Booking          from "./pages/Booking";
import Resources        from "./pages/Resources";
import Forum            from "./pages/Forum";
import AllBookings      from "./pages/AllBookings";
import UserApprovals    from "./pages/UserApproval";
import VerifyIdentity   from "./pages/VerifyIdentity";
import Profile          from "./pages/Profile";
import GoogleAuthSuccess from "./pages/GoogleAuthSuccess"; // ← NEW

import Layout           from "./components/Layout";
import ProtectedRoute   from "./components/ProtectedRoute";
import BookingDashboard from "./components/BookingDashboard";

function App() {
  return (
    <Routes>
      {/* ── Public (no Navbar) ── */}
      <Route path="/"       element={<Home />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/login"  element={<Login />} />

      {/* Google OAuth landing page — reads token from URL and logs user in */}
      <Route path="/auth/google/success" element={<GoogleAuthSuccess />} />

      {/* ── Protected (with Navbar) ── */}
      <Route element={<Layout />}>
        <Route path="/newhome" element={<Newhome />} />

        {/* Profile — all authenticated users */}
        <Route path="/profile" element={
          <ProtectedRoute allowedRoles={["student", "counsellor", "admin"]}>
            <Profile />
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

        {/* Counsellor only */}
        <Route path="/counsellorDashboard" element={
          <ProtectedRoute allowedRoles={["counsellor"]}>
            <BookingDashboard />
          </ProtectedRoute>
        } />

        {/* Student only */}
        <Route path="/all-bookings" element={
          <ProtectedRoute allowedRoles={["student"]}>
            <AllBookings />
          </ProtectedRoute>
        } />

        {/* All authenticated roles */}
        <Route path="/booking" element={
          <ProtectedRoute allowedRoles={["student", "counsellor", "admin"]}>
            <Booking />
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

        <Route path="*" element={<Navigate to="/newhome" />} />
      </Route>
    </Routes>
  );
}

export default App;
