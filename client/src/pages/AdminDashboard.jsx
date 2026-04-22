import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import api from "../lib/api";
import { useAuth } from "../context/AuthContext";

function formatCountdown(ms) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const m = String(Math.floor(s / 60)).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");
  return `${m}:${ss}`;
}

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const todayKey = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const [dateKey, setDateKey] = useState(todayKey);
  const [subject, setSubject] = useState("DBMS");
  const [time, setTime] = useState("09:00");
  const [section, setSection] = useState("");
  const [summary, setSummary] = useState(null);
  const [trend, setTrend] = useState([]);
  const [items, setItems] = useState([]);
  const [subjectStats, setSubjectStats] = useState([]);

  const [session, setSession] = useState(null);
  const [sessionCountdown, setSessionCountdown] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function loadAll(dk = dateKey) {
    setLoading(true);
    setError("");
    try {
      const [s1, s2, s3, s4, s5] = await Promise.all([
        api.get(`/admin/summary?date=${dk}`),
        api.get("/admin/trends?days=7"),
        api.get(`/admin/attendance?date=${dk}`),
        api.get(`/sessions/active?date=${dk}`),
        api.get(`/admin/subjects?from=${dk}&to=${dk}&threshold=75`),
      ]);
      setSummary(s1.data);
      setTrend(s2.data.data || []);
      setItems(s3.data.items || []);
      setSession(s4.data.session);
      setSubjectStats(s5.data.data || []);
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Failed to load admin data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll(dateKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateKey]);

  useEffect(() => {
    if (!session?.expiresAt) return undefined;
    const t = setInterval(() => {
      const ms = new Date(session.expiresAt).getTime() - Date.now();
      setSessionCountdown(ms > 0 ? formatCountdown(ms) : "00:00");
    }, 500);
    return () => clearInterval(t);
  }, [session?.expiresAt]);

  async function generateQr() {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.post("/sessions/generate", {
        date: dateKey,
        subject,
        time,
        section: section || undefined,
      });
      setSession(data.session);
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Failed to generate QR");
    } finally {
      setLoading(false);
    }
  }

  async function downloadExport(format) {
    setError("");
    try {
      const res = await api.get(`/admin/export?date=${dateKey}&format=${format}`, {
        responseType: "blob",
      });
      const blob = new Blob([res.data], { type: res.headers["content-type"] });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `attendance-${dateKey}.${format === "csv" ? "csv" : "xlsx"}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Export failed");
    }
  }

  async function copyPayload() {
    if (!session?.qrPayload) return;
    try {
      await navigator.clipboard.writeText(session.qrPayload);
    } catch (e) {
      // Fallback
      const ta = document.createElement("textarea");
      ta.value = session.qrPayload;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Admin Dashboard</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Welcome, <span className="font-medium">{user?.name}</span>. Generate a daily QR session
            and monitor attendance.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={dateKey}
            onChange={(e) => setDateKey(e.target.value)}
            className="rounded-md border bg-white dark:bg-slate-800 border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white px-3 py-2 text-sm transition-colors"
          />
          <button
            type="button"
            onClick={() => loadAll(dateKey)}
            className="rounded-md border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
          >
            Refresh
          </button>
          <button
            type="button"
            onClick={() => {
              logout();
              navigate("/login");
            }}
            className="rounded-md border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
          >
            Logout
          </button>
        </div>
      </div>

      {error ? <div className="mt-4 rounded-md bg-red-50 dark:bg-red-900/30 p-3 text-sm text-red-700 dark:text-red-400">{error}</div> : null}

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-700 p-6 shadow-sm transition-colors duration-300">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Session QR</h2>
            <button
              type="button"
              onClick={generateQr}
              disabled={loading}
              className="rounded-md bg-slate-900 dark:bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800 dark:hover:bg-indigo-700 disabled:opacity-60 transition-colors"
            >
              {session ? "Regenerate" : "Generate"}
            </button>
          </div>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Generate one QR per class session (subject + time). QR expires after 5 minutes.
          </p>

          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <label className="text-sm">
              <div className="text-xs text-gray-600 dark:text-gray-400">Subject</div>
              <input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="mt-1 w-full rounded-md border bg-white dark:bg-slate-800 border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white px-3 py-2 text-sm transition-colors"
                placeholder="DBMS"
              />
            </label>
            <label className="text-sm">
              <div className="text-xs text-gray-600 dark:text-gray-400">Time</div>
              <input
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="mt-1 w-full rounded-md border bg-white dark:bg-slate-800 border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white px-3 py-2 text-sm transition-colors"
                placeholder="09:00"
              />
            </label>
            <label className="text-sm">
              <div className="text-xs text-gray-600 dark:text-gray-400">Section (optional)</div>
              <input
                value={section}
                onChange={(e) => setSection(e.target.value)}
                className="mt-1 w-full rounded-md border bg-white dark:bg-slate-800 border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white px-3 py-2 text-sm transition-colors"
                placeholder="A"
              />
            </label>
          </div>

          {session ? (
            <div className="mt-5 grid gap-4 md:grid-cols-[160px_1fr]">
              <div className="rounded-xl border bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 p-2 transition-colors">
                <img src={session.qrImage} alt="QR Code" className="h-40 w-40" />
              </div>
              <div className="text-sm">
                <p className="text-gray-700 dark:text-gray-300">
                  <span className="font-medium">Session:</span> {session.subject} • {session.dateKey} •{" "}
                  {session.time}
                  {session.section ? ` • ${session.section}` : ""}
                </p>
                <p className="text-gray-700 dark:text-gray-300">
                  <span className="font-medium">Expires at:</span>{" "}
                  {new Date(session.expiresAt).toLocaleTimeString()}
                </p>
                <p className="mt-1 text-gray-700 dark:text-gray-300">
                  <span className="font-medium">Countdown:</span> {sessionCountdown || "—"}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={copyPayload}
                    className="rounded-md border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                  >
                    Copy QR Payload (for manual)
                  </button>
                </div>
                {session.qrPayload ? (
                  <div className="mt-2 rounded-md bg-gray-50 dark:bg-slate-800 p-2 text-xs text-gray-700 dark:text-gray-300 transition-colors">
                    <span className="font-medium">Payload:</span>{" "}
                    <span className="font-mono break-all">{session.qrPayload}</span>
                  </div>
                ) : null}
                <p className="mt-3 text-xs text-gray-500 dark:text-gray-500">
                  Students must scan this QR (camera) to mark attendance. Duplicate scans are
                  blocked by the backend.
                </p>
              </div>
            </div>
          ) : (
            <div className="mt-5 rounded-xl border bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700 p-4 text-sm text-gray-700 dark:text-gray-300 transition-colors">
              No active session for this date (or it expired). Click{" "}
              <span className="font-medium">Generate</span>.
            </div>
          )}
        </div>

        <div className="rounded-2xl border bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-700 p-6 shadow-sm transition-colors duration-300">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Summary</h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Filtered by selected date.</p>
          <div className="mt-5 grid grid-cols-3 gap-3">
            <div className="rounded-xl border bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 p-4 transition-colors">
              <p className="text-xs text-gray-500 dark:text-gray-500">Total Students</p>
              <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">{summary?.totalStudents ?? "—"}</p>
            </div>
            <div className="rounded-xl border bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 p-4 transition-colors">
              <p className="text-xs text-gray-500 dark:text-gray-500">Present</p>
              <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">{summary?.presentCount ?? "—"}</p>
            </div>
            <div className="rounded-xl border bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 p-4 transition-colors">
              <p className="text-xs text-gray-500 dark:text-gray-500">Absent</p>
              <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">{summary?.absentCount ?? "—"}</p>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => downloadExport("xlsx")}
              className="rounded-md border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
            >
              Export XLSX
            </button>
            <button
              type="button"
              onClick={() => downloadExport("csv")}
              className="rounded-md border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
            >
              Export CSV
            </button>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-700 p-6 shadow-sm transition-colors duration-300">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Last 7 Days</h2>
            <p className="text-xs text-gray-500 dark:text-gray-500">Present count</p>
          </div>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" />
                <XAxis dataKey="dateKey" tick={{ fontSize: 12 }} stroke="currentColor" />
                <YAxis allowDecimals={false} stroke="currentColor" />
                <Tooltip contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', borderColor: 'rgba(148, 163, 184, 0.3)', color: '#fff' }} />
                <Line type="monotone" dataKey="presentCount" stroke="#4F46E5" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-700 p-6 shadow-sm transition-colors duration-300">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Attendance List</h2>
            <p className="text-xs text-gray-500 dark:text-gray-500">{items.length} records</p>
          </div>
          <div className="mt-4 max-h-72 space-y-3 overflow-auto pr-1">
            {items.length === 0 ? (
              <p className="text-sm text-gray-600 dark:text-gray-400">No records for this date.</p>
            ) : (
              items.map((a) => (
                <div key={a._id} className="rounded-xl border bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 p-4 transition-colors">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{a.studentId?.name || "—"}</p>
                  <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">{a.studentId?.email || "—"}</p>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-500">
                    {new Date(a.timestamp).toLocaleString()} • Session {a.sessionId?.sessionId}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-700 p-6 shadow-sm transition-colors duration-300">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Subject Analytics</h2>
          <p className="text-xs text-gray-500 dark:text-gray-500">Below 75% highlighted</p>
        </div>
        <div className="mt-4 overflow-auto">
          <table className="min-w-[720px] w-full text-left text-sm text-gray-900 dark:text-gray-100">
            <thead className="text-xs text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-slate-700">
              <tr>
                <th className="py-2 pr-3">Subject</th>
                <th className="py-2 pr-3">Total sessions</th>
                <th className="py-2 pr-3">Attendance %</th>
                <th className="py-2 pr-3">Students &lt; 75%</th>
              </tr>
            </thead>
            <tbody className="align-top">
              {subjectStats.length === 0 ? (
                <tr>
                  <td className="py-3 text-gray-600 dark:text-gray-400" colSpan={4}>
                    No sessions found for this date.
                  </td>
                </tr>
              ) : (
                subjectStats.map((s) => (
                  <tr key={s.subject} className="border-t border-gray-200 dark:border-slate-700">
                    <td className="py-3 pr-3 font-medium text-gray-900 dark:text-white">{s.subject}</td>
                    <td className="py-3 pr-3 text-gray-700 dark:text-gray-300">{s.totalSessions}</td>
                    <td className="py-3 pr-3 text-gray-700 dark:text-gray-300">{s.attendancePercent}%</td>
                    <td className="py-3 pr-3">
                      {s.lowCount ? (
                        <div className="inline-flex items-center gap-2 rounded-full bg-amber-50 dark:bg-amber-900/30 px-3 py-1 text-amber-800 dark:text-amber-400">
                          <span className="font-medium">{s.lowCount}</span>
                          <span className="text-xs">students</span>
                        </div>
                      ) : (
                        <span className="text-gray-600 dark:text-gray-400">0</span>
                      )}
                      {s.lowCount ? (
                        <div className="mt-2 max-w-xl space-y-1 text-xs text-gray-700 dark:text-gray-300">
                          {(s.lowStudents || []).slice(0, 5).map((ls) => (
                            <div key={ls.studentId} className="flex justify-between gap-2">
                              <span className="truncate">
                                {ls.name} {ls.usn ? <span className="text-gray-500 dark:text-gray-500">({ls.usn})</span> : null}
                              </span>
                              <span className="tabular-nums text-amber-700 dark:text-amber-400">{ls.percent}%</span>
                            </div>
                          ))}
                          {s.lowCount > 5 ? (
                            <div className="text-gray-500 dark:text-gray-500">…and {s.lowCount - 5} more</div>
                          ) : null}
                        </div>
                      ) : null}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-700 p-6 shadow-sm transition-colors duration-300">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Face Verification (Placeholder)</h2>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Future enhancement: capture a selfie and verify with OpenCV/Face Recognition before
          marking attendance.
        </p>
        <div className="mt-4 rounded-xl border bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700 p-4 text-sm text-gray-700 dark:text-gray-300 transition-colors">
          The backend exposes <span className="font-mono">POST /api/face/verify</span> which
          currently returns a stub response.
        </div>
      </div>
    </div>
  );
}

