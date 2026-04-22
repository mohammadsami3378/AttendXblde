import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Home() {
  const { isAuthed, user } = useAuth();

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="rounded-2xl border bg-white p-8 text-left shadow-sm">
        <h1 className="text-3xl font-semibold tracking-tight">Smart Attendance System</h1>
        <p className="mt-2 text-slate-600">
          Hybrid attendance with <span className="font-medium">QR sessions</span> now, and a clean
          placeholder for <span className="font-medium">Face/OpenCV</span> integration later.
        </p>

        {!isAuthed ? (
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              to="/login"
              className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
            >
              Login
            </Link>
            <Link to="/register" className="rounded-md border px-4 py-2 text-sm hover:bg-slate-50">
              Create account
            </Link>
          </div>
        ) : (
          <div className="mt-6">
            <p className="text-sm text-slate-700">
              Signed in as <span className="font-medium">{user?.name}</span> ({user?.role})
            </p>
            <div className="mt-3 flex flex-wrap gap-3">
              {user?.role === "admin" ? (
                <Link
                  to="/admin-dashboard"
                  className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
                >
                  Go to Admin Dashboard
                </Link>
              ) : (
                <Link
                  to="/student-dashboard"
                  className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
                >
                  Go to Student Dashboard
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

