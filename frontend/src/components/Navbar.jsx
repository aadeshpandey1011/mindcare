import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <header className="border-b bg-white sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
        <Link to="/" className="text-2xl font-bold">MindCare</Link>
        <nav className="hidden md:flex space-x-6 text-gray-700 font-medium">
          <Link to="/chat">AI Chat</Link>
          <Link to="/screening">Screening</Link>
          <Link to="/booking">Booking</Link>
          <Link to="/resources">Resources</Link>
          <Link to="/forum">Forum</Link>
        </nav>
        <div>
          {user ? (
            <button
              onClick={logout}
              className="ml-6 px-4 py-2 bg-red-500 text-white rounded"
            >
              Logout
            </button>
          ) : (
            <Link
              to="/login"
              className="ml-6 px-4 py-2 bg-blue-600 text-white rounded"
            >
              Login
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}