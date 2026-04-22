import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../lib/api";
import { useAuth } from "../context/AuthContext";
import QrScanner from "../components/QrScanner";

export default function StudentDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [status, setStatus] = useState({ type: "idle", message: "" });
  const [attendanceSuccess, setAttendanceSuccess] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(true);
  const [items, setItems] = useState([]);
  const [manual, setManual] = useState("");
  const successTimerRef = useRef(null);

  const todayKey = useMemo(() => new Date().toISOString().slice(0, 10), []);

  async function refresh() {
    const { data } = await api.get(`/attendance/my?date=${todayKey}`);
    setItems(data.items || []);
  }

  useEffect(() => {
    refresh().catch(() => {});
    return () => {
      if (successTimerRef.current) {
        window.clearTimeout(successTimerRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function mark(scannedData) {
    if (!scannedData) {
      setStatus({ type: "error", message: "No QR data was provided." });
      return;
    }

    setStatus({ type: "loading", message: "Marking attendance..." });
    try {
      const { data } = await api.post("/attendance/mark", { scannedData });
      setStatus({ type: "success", message: "✅ Attendance Marked Successfully" });
      setAttendanceSuccess(true);
      setIsScannerOpen(false);
      await refresh();

      if (successTimerRef.current) {
        window.clearTimeout(successTimerRef.current);
      }
      successTimerRef.current = window.setTimeout(() => {
        setStatus({ type: "idle", message: "" });
        setAttendanceSuccess(false);
      }, 4500);
    } catch (err) {
      setStatus({
        type: "error",
        message: err?.response?.data?.message || err.message || "Failed to mark attendance",
      });
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex flex-col gap-6 md:flex-row">
        <div className="w-full md:w-1/2">
          <div className="rounded-2xl border bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-700 p-6 shadow-sm transition-colors duration-300">
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Student Dashboard</h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Welcome, <span className="font-medium">{user?.name}</span>. Scan today’s QR to mark
              attendance.
            </p>

            <div className="mt-4 flex items-center justify-between gap-4">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Welcome, <span className="font-medium">{user?.name}</span>. Scan today's QR to mark
                attendance.
              </div>
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
            <div className="mt-6">
              {isScannerOpen ? (
                <QrScanner
                  onScan={(text) => {
                    if (status.type === "loading") return;
                    mark(text);
                  }}
                />
              ) : (
                <div className="rounded-2xl border bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700 p-4 transition-colors">
                  <div className="flex flex-col gap-3">
                    <div className="text-sm text-gray-900 dark:text-white">QR Scanner closed after success.</div>
                    <button
                      type="button"
                      onClick={() => {
                        setAttendanceSuccess(false);
                        setStatus({ type: "idle", message: "" });
                        setIsScannerOpen(true);
                      }}
                      className="inline-flex items-center justify-center rounded-md bg-slate-900 dark:bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 dark:hover:bg-indigo-700 transition-colors"
                    >
                      Open scanner
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-5 rounded-xl border bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700 p-4 transition-colors">
              <p className="text-sm font-medium text-gray-900 dark:text-white">Manual fallback</p>
              <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                If camera isn’t working, paste the QR payload text here.
              </p>
              <div className="mt-3 flex gap-2">
                <input
                  value={manual}
                  onChange={(e) => setManual(e.target.value)}
                  className="w-full rounded-md border bg-white dark:bg-slate-700 border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-200 dark:focus:ring-slate-600 transition-colors"
                  placeholder='{"sessionId":"...","issuedAt":...}'
                />
                <button
                  type="button"
                  onClick={() => mark(manual)}
                  className="rounded-md bg-slate-900 dark:bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800 dark:hover:bg-indigo-700 transition-colors"
                >
                  Submit
                </button>
              </div>
            </div>

            {attendanceSuccess && status.type === "success" ? (
              <div className="mt-5 rounded-md bg-green-50 dark:bg-green-900/30 p-3 text-sm text-green-800 dark:text-green-400 transition-colors">
                <div className="flex items-start gap-2">
                  <div className="mt-0.5 h-5 w-5 text-green-600">✅</div>
                  <div>
                    <div className="font-medium">Attendance Marked Successfully</div>
                    <div className="mt-0.5">Your attendance has been recorded and the scanner is now closed.</div>
                  </div>
                </div>
              </div>
            ) : null}
            {status.type === "error" ? (
              <div className="mt-5 rounded-md bg-red-50 dark:bg-red-900/30 p-3 text-sm text-red-700 dark:text-red-400 transition-colors">
                <div className="font-medium">Error</div>
                <div className="mt-0.5">{status.message}</div>
              </div>
            ) : null}
            {status.type === "loading" ? (
              <div className="mt-5 rounded-md bg-slate-100 dark:bg-slate-800 p-3 text-sm text-slate-700 dark:text-slate-300 transition-colors">
                {status.message}
              </div>
            ) : null}
          </div>
        </div>

        <div className="w-full md:w-1/2">
          <div className="rounded-2xl border bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-700 p-6 shadow-sm transition-colors duration-300">
            <div className="flex items-baseline justify-between">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Today's Records</h2>
              <button
                className="text-sm text-gray-700 dark:text-gray-300 underline hover:text-gray-900 dark:hover:text-white transition-colors"
                type="button"
                onClick={() => refresh()}
              >
                Refresh
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {items.length === 0 ? (
                <p className="text-sm text-gray-600 dark:text-gray-400">No attendance marked yet today.</p>
              ) : (
                items.map((a) => (
                  <div key={a._id} className="rounded-xl border bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 p-4 transition-colors">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Marked</p>
                    <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                      {new Date(a.timestamp).toLocaleString()}
                    </p>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-500">Session: {a.sessionId?.sessionId}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

