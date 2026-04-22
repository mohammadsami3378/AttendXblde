const Attendance = require("../models/Attendance");
const Session = require("../models/Session");

const LATE_GRACE_MINUTES = Number(process.env.LATE_GRACE_MINUTES || 10);

function getStatusForScan({ dateKey, time, scannedAt }) {
  if (!dateKey || !time) return "Present";
  const start = new Date(`${dateKey}T${time}:00`);
  if (Number.isNaN(start.getTime())) return "Present";
  const lateAfter = new Date(start.getTime() + LATE_GRACE_MINUTES * 60_000);
  return scannedAt > lateAfter ? "Late" : "Present";
}

// POST /api/attendance/mark (student)
// body: { scannedData: "..." , webcamImage?: "data:image/jpeg;base64,..." }
async function markAttendance(req, res, next) {
  try {
    const { scannedData, webcamImage } = req.body || {};
    if (!scannedData) {
      res.status(400);
      throw new Error("scannedData is required.");
    }

    // eslint-disable-next-line no-console
    console.log("[attendance.mark] start", { studentId: String(req.user?._id || ""), len: String(scannedData).length });

    let payload;
    try {
      payload = JSON.parse(String(scannedData));
    } catch (e) {
      res.status(400);
      throw new Error("Invalid QR payload. Expected JSON string.");
    }

    const { sessionId, issuedAt } = payload || {};
    if (!sessionId || !issuedAt) {
      res.status(400);
      throw new Error("Invalid QR payload: missing sessionId/issuedAt.");
    }

    const session = await Session.findOne({ sessionId: String(sessionId) });
    if (!session) {
      res.status(404);
      throw new Error("Session not found.");
    }

    const now = new Date();
    if (session.expiresAt <= now) {
      res.status(400);
      throw new Error("QR code expired. Ask admin to generate a new one.");
    }

    // Extra safety: if QR's issuedAt doesn't match session creation window, reject.
    const issuedAtMs = Number(issuedAt);
    if (Number.isNaN(issuedAtMs)) {
      res.status(400);
      throw new Error("Invalid issuedAt in QR payload.");
    }
    if (Math.abs(issuedAtMs - new Date(session.createdAt).getTime()) > 10 * 60 * 1000) {
      res.status(400);
      throw new Error("QR code is not valid for this session.");
    }

    try {
      const status = getStatusForScan({ dateKey: session.dateKey, time: session.time, scannedAt: now });
      const attendance = await Attendance.create({
        studentId: req.user._id,
        sessionId: session._id,
        dateKey: session.dateKey,
        subject: session.subject,
        time: session.time,
        status,
        timestamp: now,
        faceVerified: false, // placeholder (future face verification)
        ...(webcamImage ? { webcamImage: String(webcamImage) } : null),
      });

      // eslint-disable-next-line no-console
      console.log("[attendance.mark] saved", {
        id: String(attendance._id),
        dateKey: attendance.dateKey,
        status: attendance.status,
        sessionId: String(attendance.sessionId),
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
      // Duplicate key error => already marked
      if (err && err.code === 11000) {
        res.status(409);
        throw new Error("Attendance already marked for this session.");
      }
      throw err;
    }
  } catch (err) {
    next(err);
  }
}

// GET /api/attendance/my?date=YYYY-MM-DD (student)
async function myAttendance(req, res, next) {
  try {
    const filter = { studentId: req.user._id };
    if (req.query.date) filter.dateKey = String(req.query.date);

    const items = await Attendance.find(filter)
      .sort({ timestamp: -1 })
      .populate({ path: "sessionId", select: "sessionId dateKey expiresAt createdAt" });

    res.json({ items });
  } catch (err) {
    next(err);
  }
}

module.exports = { markAttendance, myAttendance };

