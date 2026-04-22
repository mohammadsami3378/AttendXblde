import { Navigate, Route, Routes } from "react-router-dom";
import { AdminRoute, StudentRoute } from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Register from "./pages/Register";
import StudentDashboard from "./pages/StudentDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import { useAuth } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";

function App() {
  const { role, isAuthed } = useAuth();
  const destination = role === "admin" ? "/admin-dashboard" : "/student-dashboard";

  return (
    <ThemeProvider>
      <div className="min-h-full bg-white dark:bg-slate-950 text-gray-900 dark:text-white transition-colors duration-300">
        <Routes>
          <Route
            path="/"
            element={
              isAuthed ? <Navigate to={destination} replace /> : <Navigate to="/login" replace />
            }
          />
          <Route
            path="/login"
            element={isAuthed ? <Navigate to={destination} replace /> : <Login />}
          />
          <Route
            path="/register"
            element={isAuthed ? <Navigate to={destination} replace /> : <Register />}
          />

          <Route
            path="/student-dashboard"
            element={
              <StudentRoute>
                <StudentDashboard />
              </StudentRoute>
            }
          />

          <Route
            path="/admin-dashboard"
            element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </ThemeProvider>
  );
}

export default App;
