import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Register() {
  const { register, loading } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("student");
  const [usn, setUsn] = useState("");
  const [adminId, setAdminId] = useState("");
  const [adminSecret, setAdminSecret] = useState("");
  const [error, setError] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      const user = await register({
        name,
        email,
        password,
        role,
        usn: role === "student" ? usn : undefined,
        adminId: role === "admin" ? adminId : undefined,
        adminSecret,
      });
      const destination = user.role === "admin" ? "/admin-dashboard" : "/student-dashboard";
      navigate(destination);
    } catch (err) {
      if (err?.message === "Network Error") {
        setError("API unreachable. Start the server and ensure MongoDB is connected.");
      } else {
        setError(err?.response?.data?.message || err.message || "Registration failed");
      }
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <div className="rounded-2xl border bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-700 p-6 shadow-sm transition-colors duration-300">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Register</h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Create a student account (or admin with secret).</p>

        {error ? <div className="mt-4 rounded-md bg-red-50 dark:bg-red-900/30 p-3 text-sm text-red-700 dark:text-red-400">{error}</div> : null}

        <form className="mt-6 space-y-4" onSubmit={onSubmit}>
          <label className="block text-left text-sm">
            <span className="text-gray-700 dark:text-gray-300">Full name</span>
            <input
              className="mt-1 w-full rounded-md border bg-white dark:bg-slate-800 border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white px-3 py-2 outline-none focus:ring-2 focus:ring-slate-200 dark:focus:ring-slate-600 transition-colors"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </label>

          <label className="block text-left text-sm">
            <span className="text-gray-700 dark:text-gray-300">Email</span>
            <input
              className="mt-1 w-full rounded-md border bg-white dark:bg-slate-800 border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white px-3 py-2 outline-none focus:ring-2 focus:ring-slate-200 dark:focus:ring-slate-600 transition-colors"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              required
            />
          </label>

          <label className="block text-left text-sm">
            <span className="text-gray-700 dark:text-gray-300">Password</span>
            <input
              className="mt-1 w-full rounded-md border bg-white dark:bg-slate-800 border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white px-3 py-2 outline-none focus:ring-2 focus:ring-slate-200 dark:focus:ring-slate-600 transition-colors"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              required
              minLength={6}
            />
          </label>

          <label className="block text-left text-sm">
            <span className="text-gray-700 dark:text-gray-300">Role</span>
            <select
              className="mt-1 w-full rounded-md border bg-white dark:bg-slate-800 border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white px-3 py-2 outline-none focus:ring-2 focus:ring-slate-200 dark:focus:ring-slate-600 transition-colors"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              <option value="student">Student</option>
              <option value="admin">Admin</option>
            </select>
          </label>

          {role === "student" ? (
            <label className="block text-left text-sm">
              <span className="text-gray-700 dark:text-gray-300">USN</span>
              <input
                className="mt-1 w-full rounded-md border bg-white dark:bg-slate-800 border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white px-3 py-2 uppercase outline-none focus:ring-2 focus:ring-slate-200 dark:focus:ring-slate-600 transition-colors"
                value={usn}
                onChange={(e) => setUsn(e.target.value)}
                placeholder="e.g., 1RV21CS001"
                required
              />
            </label>
          ) : null}

          {role === "admin" ? (
            <>
              <label className="block text-left text-sm">
                <span className="text-gray-700 dark:text-gray-300">Admin ID</span>
                <input
                  className="mt-1 w-full rounded-md border bg-white dark:bg-slate-800 border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white px-3 py-2 outline-none focus:ring-2 focus:ring-slate-200 dark:focus:ring-slate-600 transition-colors"
                  value={adminId}
                  onChange={(e) => setAdminId(e.target.value)}
                  placeholder="e.g., ADM-001"
                  required
                />
              </label>
              <label className="block text-left text-sm">
                <span className="text-gray-700 dark:text-gray-300">Admin bootstrap secret</span>
                <input
                  className="mt-1 w-full rounded-md border bg-white dark:bg-slate-800 border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white px-3 py-2 outline-none focus:ring-2 focus:ring-slate-200 dark:focus:ring-slate-600 transition-colors"
                  value={adminSecret}
                  onChange={(e) => setAdminSecret(e.target.value)}
                  placeholder="Matches server ADMIN_BOOTSTRAP_SECRET"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-500">
                  If the secret is wrong/missing, the account will be created as a student.
                </p>
              </label>
            </>
          ) : null}

          <button
            className="w-full rounded-md bg-slate-900 dark:bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 dark:hover:bg-indigo-700 disabled:opacity-60 transition-colors"
            disabled={loading}
            type="submit"
          >
            {loading ? "Creating..." : "Create account"}
          </button>
        </form>

        <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-gray-900 dark:text-white underline hover:text-gray-700 dark:hover:text-gray-200 transition-colors">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}

