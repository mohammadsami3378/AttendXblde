const { v4: uuidv4 } = require("uuid");
const QRCode = require("qrcode");
const Session = require("../models/Session");
const { toDateKey } = require("../utils/date");

const QR_TTL_MS = 5 * 60 * 1000; // 5 minutes

function normalizeSubject(s) {
  return String(s || "")
    .trim()
    .replace(/\s+/g, " ")
    .toUpperCase();
}

function normalizeTime(t) {
  const v = String(t || "").trim();
  // Basic HH:mm
  if (!/^\d{2}:\d{2}$/.test(v)) return null;
  const [hh, mm] = v.split(":").map((x) => Number(x));
  if (hh < 0 || hh > 23 || mm < 0 || mm > 59) return null;
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

function generateSessionCode({ subject, dateKey, time }) {
  const safeSubject = normalizeSubject(subject).replace(/[^A-Z0-9]+/g, "_");
  return `${safeSubject}_${dateKey}_${time}`;
}

// POST /api/sessions/generate (admin)
async function generateDailySession(req, res, next) {
  try {
    const now = new Date();
    const dateKey = req.body?.date ? String(req.body.date) : toDateKey(now);
    const subject = req.body?.subject ? normalizeSubject(req.body.subject) : null;
    const time = req.body?.time ? normalizeTime(req.body.time) : null;
    const section = req.body?.section ? String(req.body.section).trim() : undefined;

    // Backward compatibility: if no subject/time provided, keep the old "daily" behavior.
    const isLegacyDaily = !subject || !time;

    // If there is still a valid session for today (and same subject/time), reuse it.
    const activeQuery = isLegacyDaily
      ? { dateKey, expiresAt: { $gt: now } }
      : { dateKey, subject, time, expiresAt: { $gt: now } };

    const active = await Session.findOne(activeQuery).sort({ createdAt: -1 });
    if (active) {
      return res.json({
        session: {
          id: active._id,
          dateKey: active.dateKey,
          sessionId: active.sessionId,
          subject: active.subject,
          time: active.time,
          section: active.section,
          expiresAt: active.expiresAt,
          qrImage: active.qrImage,
          qrPayload: active.qrPayload,
        },
      });
    }

    const issuedAt = Date.now();
    const expiresAt = new Date(issuedAt + QR_TTL_MS);

    const finalSubject = subject || "DAILY";
    const finalTime = time || new Date(issuedAt).toTimeString().slice(0, 5);

    // New sessionId format: SUBJECT_YYYY-MM-DD_HH:mm (as requested)
    // Legacy fallback: UUID if something unexpected happens.
    const sessionId = isLegacyDaily ? uuidv4() : generateSessionCode({ subject: finalSubject, dateKey, time: finalTime });

    // Keep payload as JSON text for easy scanning/parsing.
    const payloadObj = { sessionId, issuedAt };
    const qrPayload = JSON.stringify(payloadObj);

    const qrImage = await QRCode.toDataURL(qrPayload, {
      errorCorrectionLevel: "M",
      margin: 1,
      scale: 8,
    });

    const session = await Session.create({
      dateKey,
      sessionId,
      subject: finalSubject,
      time: finalTime,
      section,
      qrPayload,
      qrImage,
      expiresAt,
      createdBy: req.user._id,
    });

    return res.status(201).json({
      session: {
        id: session._id,
        dateKey: session.dateKey,
        sessionId: session.sessionId,
        subject: session.subject,
        time: session.time,
        section: session.section,
        expiresAt: session.expiresAt,
        qrImage: session.qrImage,
        qrPayload: session.qrPayload,
      },
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/sessions/active?date=YYYY-MM-DD (admin)
async function getActiveSession(req, res, next) {
  try {
    const dateKey = req.query.date ? String(req.query.date) : toDateKey(new Date());
    const now = new Date();
    const active = await Session.findOne({ dateKey, expiresAt: { $gt: now } }).sort({ createdAt: -1 });
    res.json({
      session: active
        ? {
            id: active._id,
            dateKey: active.dateKey,
            sessionId: active.sessionId,
            subject: active.subject,
            time: active.time,
            section: active.section,
            expiresAt: active.expiresAt,
            qrImage: active.qrImage,
            qrPayload: active.qrPayload,
          }
        : null,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { generateDailySession, getActiveSession, QR_TTL_MS };

