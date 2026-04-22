const XLSX = require("xlsx");
const User = require("../models/User");
const Attendance = require("../models/Attendance");
const Session = require("../models/Session");
const { toDateKey } = require("../utils/date");

function normalizeRange(query) {
  const today = toDateKey(new Date());
  const from = query.from ? String(query.from) : today;
  const to = query.to ? String(query.to) : from;
  return { from, to };
}

// GET /api/admin/summary?date=YYYY-MM-DD
async function getSummary(req, res, next) {
  try {
    const dateKey = req.query.date ? String(req.query.date) : toDateKey(new Date());

    const totalStudents = await User.countDocuments({ role: "student" });
    const presentCount = await Attendance.countDocuments({ dateKey });
    const absentCount = Math.max(0, totalStudents - presentCount);

    res.json({
      dateKey,
      totalStudents,
      presentCount,
      absentCount,
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/admin/attendance?date=YYYY-MM-DD
async function listAttendance(req, res, next) {
  try {
    const dateKey = req.query.date ? String(req.query.date) : toDateKey(new Date());
    const items = await Attendance.find({ dateKey })
      .sort({ timestamp: -1 })
      .populate({ path: "studentId", select: "name email role" })
      .populate({ path: "sessionId", select: "sessionId expiresAt createdAt" });

    res.json({ dateKey, items });
  } catch (err) {
    next(err);
  }
}

// GET /api/admin/trends?days=7
async function trends(req, res, next) {
  try {
    const days = Math.min(31, Math.max(1, Number(req.query.days || 7)));
    const today = new Date();

    const keys = [];
    for (let i = days - 1; i >= 0; i -= 1) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      keys.push(toDateKey(d));
    }

    const counts = await Attendance.aggregate([
      { $match: { dateKey: { $in: keys } } },
      { $group: { _id: "$dateKey", presentCount: { $sum: 1 } } },
    ]);

    const map = new Map(counts.map((c) => [c._id, c.presentCount]));
    res.json({
      days,
      data: keys.map((k) => ({ dateKey: k, presentCount: map.get(k) || 0 })),
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/admin/subjects?from=YYYY-MM-DD&to=YYYY-MM-DD&threshold=75
async function subjectAnalytics(req, res, next) {
  try {
    const { from, to } = normalizeRange(req.query || {});
    const threshold = Math.min(100, Math.max(0, Number(req.query.threshold || 75)));

    const [totalStudents, sessionsBySubject, attendanceByStudentSubject] = await Promise.all([
      User.countDocuments({ role: "student" }),
      Session.aggregate([
        { $match: { dateKey: { $gte: from, $lte: to } } },
        { $group: { _id: "$subject", totalSessions: { $sum: 1 } } },
      ]),
      Attendance.aggregate([
        { $match: { dateKey: { $gte: from, $lte: to } } },
        { $group: { _id: { subject: "$subject", studentId: "$studentId" }, attended: { $sum: 1 } } },
      ]),
    ]);

    const sessionsMap = new Map(sessionsBySubject.map((s) => [s._id, s.totalSessions]));
    const subjects = Array.from(sessionsMap.keys()).sort((a, b) => String(a).localeCompare(String(b)));

    const studentIds = Array.from(
      new Set(attendanceByStudentSubject.map((r) => String(r._id.studentId)))
    );
    const students = await User.find({ _id: { $in: studentIds } }, { name: 1, usn: 1, email: 1 }).lean();
    const studentMap = new Map(students.map((u) => [String(u._id), u]));

    const perSubjectStudent = new Map(); // subject -> Map(studentId -> attended)
    for (const row of attendanceByStudentSubject) {
      const subject = row._id.subject;
      const sid = String(row._id.studentId);
      if (!perSubjectStudent.has(subject)) perSubjectStudent.set(subject, new Map());
      perSubjectStudent.get(subject).set(sid, row.attended);
    }

    const data = subjects.map((subj) => {
      const totalSessions = sessionsMap.get(subj) || 0;
      const studentAtt = perSubjectStudent.get(subj) || new Map();
      const totalMarks = Array.from(studentAtt.values()).reduce((a, b) => a + b, 0);
      const denom = totalSessions > 0 ? totalStudents * totalSessions : 0;
      const attendancePercent = denom > 0 ? (totalMarks / denom) * 100 : 0;

      const lowStudents = [];
      if (totalSessions > 0) {
        for (const [sid, attended] of studentAtt.entries()) {
          const pct = (attended / totalSessions) * 100;
          if (pct < threshold) {
            const u = studentMap.get(sid);
            lowStudents.push({
              studentId: sid,
              name: u?.name || "—",
              usn: u?.usn || "",
              email: u?.email || "",
              attended,
              totalSessions,
              percent: Number(pct.toFixed(2)),
            });
          }
        }
      }
      lowStudents.sort((a, b) => a.percent - b.percent);

      return {
        subject: subj,
        totalSessions,
        attendancePercent: Number(attendancePercent.toFixed(2)),
        lowCount: lowStudents.length,
        lowStudents,
      };
    });

    res.json({ from, to, threshold, totalStudents, data });
  } catch (err) {
    next(err);
  }
}

// GET /api/admin/export?date=YYYY-MM-DD&format=xlsx|csv
async function exportAttendance(req, res, next) {
  try {
    const dateKey = req.query.date ? String(req.query.date) : toDateKey(new Date());
    const format = String(req.query.format || "xlsx").toLowerCase();

    const items = await Attendance.find({ dateKey })
      .sort({ timestamp: 1 })
      .populate({ path: "studentId", select: "name email usn" })
      .populate({ path: "sessionId", select: "sessionId" });

    const rows = items.map((a) => {
      const formattedDate = a.timestamp ? new Date(a.timestamp).toISOString().split("T")[0] : dateKey;
      return {
        "Student Name": a.studentId?.name || "",
        USN: a.studentId?.usn || "",
        Subject: a.subject || "",
        Date: formattedDate,
        Time: a.time || "",
        Status: a.status || "",
      };
    });

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, "Attendance");

    if (format === "csv") {
      const csv = XLSX.utils.sheet_to_csv(ws);
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", `attachment; filename="attendance-${dateKey}.csv"`);
      return res.send(csv);
    }

    const buffer = XLSX.write(wb, { bookType: "xlsx", type: "buffer" });
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader("Content-Disposition", `attachment; filename="attendance-${dateKey}.xlsx"`);
    return res.send(buffer);
  } catch (err) {
    next(err);
  }
}

module.exports = { getSummary, listAttendance, trends, subjectAnalytics, exportAttendance };

