const mongoose = require("mongoose");

const sessionSchema = new mongoose.Schema(
  {
    dateKey: { type: String, required: true, index: true }, // YYYY-MM-DD
    sessionId: { type: String, required: true, unique: true, index: true },
    subject: { type: String, required: true, trim: true },
    time: { type: String, required: true, trim: true }, // HH:mm
    section: { type: String, trim: true },
    qrPayload: { type: String, required: true }, // JSON string scanned by students
    qrImage: { type: String, required: true }, // data:image/png;base64,...
    expiresAt: { type: Date, required: true, index: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

sessionSchema.index({ dateKey: 1, expiresAt: 1 });
sessionSchema.index({ dateKey: 1, subject: 1, time: 1 }, { unique: true });

module.exports = mongoose.model("Session", sessionSchema);

