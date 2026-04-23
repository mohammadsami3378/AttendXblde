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
  if (!/^\d{2}:\d{2}$/.test(v)) return null;

  const [hh, mm] = v.split(":").map(Number);
  if (hh < 0 || hh > 23 || mm < 0 || mm > 59) return null;

  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

function generateSessionCode({ subject, dateKey, time }) {
  const safeSubject = normalizeSubject(subject).replace(/[^A-Z0-9]+/g, "_");
  return `${safeSubject}_${dateKey}_${time}`;
}

// 🔥 GENERATE SESSION
async function generateDailySession(req, res, next) {
  try {
    const now = new Date();

    const dateKey = req.body?.date
      ? String(req.body.date)
      : toDateKey(now);

    const subject = req.body?.subject
      ? normalizeSubject(req.body.subject)
      : null;

    const time = req.body?.time
      ? normalizeTime(req.body.time)
      : null;

    const section = req.body?.section
      ? String(req.body.section).trim()
      : undefined;

    const isLegacyDaily = !subject || !time;

    const activeQuery = isLegacyDaily
      ? { dateKey, expiresAt: { $gt: now } }
      : { dateKey, subject, time, expiresAt: { $gt: now } };

    const active = await Session.findOne(activeQuery).sort({ createdAt: -1 });

    if (active) {
      return res.json({ session: active });
    }

    const createdAt = new Date();
    const expiresAt = new Date(createdAt.getTime() + QR_TTL_MS);

    const finalSubject = subject || "DAILY";
    const finalTime = time || new Date().toTimeString().slice(0, 5);

    const sessionId = isLegacyDaily
      ? uuidv4()
      : generateSessionCode({
          subject: finalSubject,
          dateKey,
          time: finalTime,
        });

    const qrPayload = JSON.stringify({ sessionId });

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

    return res.status(201).json({ session });
  } catch (err) {
    next(err);
  }
}

// 🔥 GET ACTIVE SESSION (THIS WAS MISSING ❌)
async function getActiveSession(req, res, next) {
  try {
    const dateKey = req.query.date
      ? String(req.query.date)
      : toDateKey(new Date());

    const now = new Date();

    const active = await Session.findOne({
      dateKey,
      expiresAt: { $gt: now },
    }).sort({ createdAt: -1 });

    return res.json({
      session: active || null,
    });
  } catch (err) {
    next(err);
  }
}

// ✅ EXPORT FIX (VERY IMPORTANT)
module.exports = {
  generateDailySession,
  getActiveSession,
};