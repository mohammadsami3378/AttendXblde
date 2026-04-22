import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function ProtectedRoute({ roles, children }) {
  const { isAuthed, role } = useAuth();

  if (!isAuthed) return <Navigate to="/login" replace />;
  if (roles && roles.length > 0 && !roles.includes(role)) return <Navigate to="/login" replace />;

  return children;
}

export default ProtectedRoute;

export function AdminRoute({ children }) {
  return <ProtectedRoute roles={["admin"]}>{children}</ProtectedRoute>;
}

export function StudentRoute({ children }) {
  return <ProtectedRoute roles={["student"]}>{children}</ProtectedRoute>;
}

