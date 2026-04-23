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
      return res.json({
        session: active,
      });
    }

    // ✅ FIX: Use createdAt as base time
    const createdAt = new Date();
    const expiresAt = new Date(createdAt.getTime() + QR_TTL_MS);

    const finalSubject = subject || "DAILY";
    const finalTime =
      time || new Date().toTimeString().slice(0, 5);

    const sessionId = isLegacyDaily
      ? uuidv4()
      : generateSessionCode({
          subject: finalSubject,
          dateKey,
          time: finalTime,
        });

    // ✅ SIMPLIFIED payload (remove strict dependency)
    const qrPayload = JSON.stringify({
      sessionId,
    });

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
      session,
    });
  } catch (err) {
    next(err);
  }
}