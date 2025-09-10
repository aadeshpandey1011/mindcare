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

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/login" element={<Login />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/screening" element={<Screening />} />
      <Route path="/chat" element={<ChatSupport />} />
      <Route path="/booking" element={<Booking />} />
      <Route path="/resources" element={<Resources />} />
      <Route path="/forum" element={<Forum />} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default App;
