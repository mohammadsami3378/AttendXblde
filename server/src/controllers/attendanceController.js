const Attendance = require("../models/Attendance");
const Session = require("../models/Session");

const LATE_GRACE_MINUTES = Number(process.env.LATE_GRACE_MINUTES || 10);

// 🔹 Determine Present / Late
function getStatusForScan({ dateKey, time, scannedAt }) {
  if (!dateKey || !time) return "Present";

  const start = new Date(`${dateKey}T${time}:00`);
  if (Number.isNaN(start.getTime())) return "Present";

  const lateAfter = new Date(start.getTime() + LATE_GRACE_MINUTES * 60_000);

  return scannedAt > lateAfter ? "Late" : "Present";
}

// 🔥 POST /api/attendance/mark
async function markAttendance(req, res, next) {
  try {
    const { scannedData, webcamImage } = req.body || {};

    if (!scannedData) {
      return res.status(400).json({ message: "scannedData is required." });
    }

    // Parse QR payload
    let payload;
    try {
      payload = JSON.parse(String(scannedData));
    } catch {
      return res.status(400).json({ message: "Invalid QR payload." });
    }

    const { sessionId, issuedAt } = payload;

    if (!sessionId || !issuedAt) {
      return res.status(400).json({
        message: "Invalid QR payload: missing sessionId/issuedAt.",
      });
    }

    // Find session
    const session = await Session.findOne({ sessionId: String(sessionId) });

    if (!session) {
      return res.status(404).json({ message: "Session not found." });
    }

    const now = new Date();

    // Check expiry
    if (session.expiresAt <= now) {
      return res.status(400).json({
        message: "QR code expired. Ask admin to regenerate.",
      });
    }

    // Validate issuedAt
    const issuedAtMs = Number(issuedAt);
    if (Number.isNaN(issuedAtMs)) {
      return res.status(400).json({ message: "Invalid issuedAt." });
    }

    if (
      Math.abs(
        issuedAtMs - new Date(session.createdAt).getTime()
      ) > 10 * 60 * 1000
    ) {
      return res.status(400).json({
        message: "QR code is not valid for this session.",
      });
    }

    // 🔥 IMPORTANT FIX: Prevent duplicate attendance
    const existing = await Attendance.findOne({
      studentId: req.user._id,
      sessionId: session._id,
    });

    if (existing) {
      return res.status(409).json({
        message: "Attendance already marked for this session.",
      });
    }

    // Determine status
    const status = getStatusForScan({
      dateKey: session.dateKey,
      time: session.time,
      scannedAt: now,
    });

    // Save attendance
    const attendance = await Attendance.create({
      studentId: req.user._id,
      sessionId: session._id,
      dateKey: session.dateKey,
      subject: session.subject,
      time: session.time,
      status,
      timestamp: now,
      faceVerified: false,
      ...(webcamImage ? { webcamImage: String(webcamImage) } : {}),
    });

    return res.status(201).json({
      message: `Attendance marked: ${attendance.status}.`,
      attendance: {
        id: attendance._id,
        dateKey: attendance.dateKey,
        timestamp: attendance.timestamp,
        status: attendance.status,
      },
    });
  } catch (err) {
    next(err);
  }
}

// 🔹 GET /api/attendance/my
async function myAttendance(req, res, next) {
  try {
    const filter = { studentId: req.user._id };

    if (req.query.date) {
      filter.dateKey = String(req.query.date);
    }

    const items = await Attendance.find(filter)
      .sort({ timestamp: -1 })
      .populate({
        path: "sessionId",
        select: "sessionId dateKey expiresAt createdAt",
      });

    return res.json({ items });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  markAttendance,
  myAttendance,
};