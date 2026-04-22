import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

export default function Navbar() {
  const { user, isAuthed, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  return (
    <header className="border-b bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-700 transition-colors duration-300">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link to="/" className="text-lg font-semibold tracking-tight text-gray-900 dark:text-white">
          Smart Attendance
        </Link>

        <nav className="flex items-center gap-4 text-sm">
          {isAuthed && user?.role === "admin" && (
            <Link to="/admin-dashboard" className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors">
              Admin
            </Link>
          )}
          {isAuthed && user?.role === "student" && (
            <Link to="/student-dashboard" className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors">
              Student
            </Link>
          )}

          {/* Theme Toggle Button */}
          <button
            type="button"
            onClick={toggleTheme}
            className="rounded-md px-3 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Toggle theme"
          >
            {theme === "light" ? "🌙" : "☀️"}
          </button>

          {!isAuthed ? (
            <>
              <Link to="/login" className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors">
                Login
              </Link>
              <Link
                to="/register"
                className="rounded-md bg-slate-900 dark:bg-indigo-600 px-3 py-2 font-medium text-white hover:bg-slate-800 dark:hover:bg-indigo-700 transition-colors"
              >
                Register
              </Link>
            </>
          ) : (
            <button
              type="button"
              onClick={() => {
                logout();
                navigate("/login");
              }}
              className="rounded-md border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
            >
              Logout
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}

