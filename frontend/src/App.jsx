// import { Routes, Route, Navigate } from "react-router-dom";
// import Home from "./pages/Home";
// import Signup from "./pages/Signup";
// import Login from "./pages/Login";
// import Dashboard from "./pages/Dashboard";

// // Future pages
// import Screening from "./pages/Screening";
// import ChatSupport from "./pages/ChatSupport";
// import Booking from "./pages/Booking";
// import Resources from "./pages/Resources";
// import Forum from "./pages/Forum";

// function App() {
//   return (
//     <Routes>
//       <Route path="/" element={<Home />} />
//       <Route path="/signup" element={<Signup />} />
//       <Route path="/login" element={<Login />} />
//       <Route path="/dashboard" element={<Dashboard />} />
//       <Route path="/screening" element={<Screening />} />
//       <Route path="/chat" element={<ChatSupport />} />
//       <Route path="/booking" element={<Booking />} />
//       <Route path="/resources" element={<Resources />} />
//       <Route path="/forum" element={<Forum />} />
//       <Route path="*" element={<Navigate to="/" />} />
//     </Routes>
//   );
// }

// export default App;






import { Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";

// Future pages
import Screening from "./pages/Screening";
import ChatSupport from "./pages/ChatSupport";
import Booking from "./pages/Booking";
import Resources from "./pages/Resources";
import Forum from "./pages/Forum";
import UserApprovals from "./pages/UserApproval";

// Wrappers
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<Home />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/login" element={<Login />} />

      {/* Admin-only route */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <Dashboard />
          </ProtectedRoute>
        }
      />

      {/* Authenticated user routes (students, counselors, admins etc.) */}
      <Route
        path="/screening"
        element={
          <ProtectedRoute allowedRoles={["student", "counselor", "admin"]}>
            <Screening />
          </ProtectedRoute>
        }
      />
      <Route
        path="/chat"
        element={
          <ProtectedRoute allowedRoles={["student", "counselor", "admin"]}>
            <ChatSupport />
          </ProtectedRoute>
        }
      />
      <Route
        path="/booking"
        element={
          <ProtectedRoute allowedRoles={["student", "counselor", "admin"]}>
            <Booking />
          </ProtectedRoute>
        }
      />
      <Route
        path="/resources"
        element={
          <ProtectedRoute allowedRoles={["student", "counselor", "admin"]}>
            <Resources />
          </ProtectedRoute>
        }
      />
      <Route
        path="/forum"
        element={
          <ProtectedRoute allowedRoles={["student", "counselor", "admin"]}>
            <Forum />
          </ProtectedRoute>
        }
      />

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" />} />

      <Route
        path="/approvals"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <UserApprovals />
          </ProtectedRoute>
        }
      />

    </Routes>
  );
}

export default App;
