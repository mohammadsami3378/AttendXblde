require("dotenv").config({ override: true });

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");

const { connectDB } = require("./config/db");
const { notFound, errorHandler } = require("./middleware/error");
const { sanitizeMongoInputs } = require("./middleware/sanitize");

const authRoutes = require("./routes/authRoutes");
const sessionRoutes = require("./routes/sessionRoutes");
const attendanceRoutes = require("./routes/attendanceRoutes");
const adminRoutes = require("./routes/adminRoutes");
const faceRoutes = require("./routes/faceRoutes");

const app = express();

// 🔥 DEBUG LOG (to confirm deployment)
console.log("🔥 NEW CODE DEPLOYED");

// ✅ Security & Middleware
app.use(helmet());

// ✅ TEMP FIX CORS (allow all for now)
app.use(
  cors({
    origin: "*",
  })
);

app.use(express.json({ limit: "5mb" }));
app.use(sanitizeMongoInputs);
app.use(morgan("dev"));

// ✅ Rate Limiting
app.use(
  "/api",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 300,
    standardHeaders: "draft-7",
    legacyHeaders: false,
  })
);

// ✅ Root Route
app.get("/", (req, res) => {
  res.send("AttendX API is running 🚀");
});

// ✅ Health Check Route (IMPORTANT)
app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    service: "smart-attendance-api",
    time: new Date(),
  });
});

// ✅ API Routes
app.use("/api/auth", authRoutes);
app.use("/api/sessions", sessionRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/face", faceRoutes);

// ❌ Not Found Handler
app.use(notFound);

// ❌ Error Handler
app.use(errorHandler);

// ✅ PORT (Render uses process.env.PORT)
const PORT = process.env.PORT || 5000;

// ✅ Start Server
async function start() {
  try {
    await connectDB();
    console.log("✅ MongoDB Connected");

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error("❌ Failed to start server:", err);
    process.exit(1);
  }
}

start();