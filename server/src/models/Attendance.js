const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    sessionId: { type: mongoose.Schema.Types.ObjectId, ref: "Session", required: true, index: true },
    dateKey: { type: String, required: true, index: true }, // YYYY-MM-DD (denormalized for fast filtering)
    subject: { type: String, required: true, trim: true },
    time: { type: String, required: true, trim: true }, // HH:mm
    status: { type: String, enum: ["Present", "Late"], required: true },
    timestamp: { type: Date, default: Date.now },
    // Bonus (future): face verification result placeholder
    faceVerified: { type: Boolean, default: false },
    // Anti-proxy (basic): store a snapshot image when provided
    webcamImage: { type: String }, // data:image/jpeg;base64,...
  },
  { timestamps: true }
);

attendanceSchema.index({ studentId: 1, sessionId: 1 }, { unique: true });

module.exports = mongoose.model("Attendance", attendanceSchema);

