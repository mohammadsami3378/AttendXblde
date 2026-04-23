require("dotenv").config();

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

// 🔥 DEBUG LOG
console.log("🔥 Backend starting...");

// ✅ Security
app.use(helmet());

// ✅ CORS (will restrict later after frontend deploy)
app.use(
  cors({
    origin: process.env.CLIENT_URL || "*",
    credentials: true,
  })
);

// ✅ Body parser
app.use(express.json({ limit: "5mb" }));

// ✅ Sanitize
app.use(sanitizeMongoInputs);

// ✅ Logger
app.use(morgan("dev"));

// ✅ Rate Limiting
app.use(
  "/api",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

// ✅ Root Route
app.get("/", (req, res) => {
  res.send("AttendX API is running 🚀");
});

// ✅ Health Route (VERY IMPORTANT FOR RENDER)
app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "API is healthy ✅",
    time: new Date(),
  });
});

// ✅ API Routes
app.use("/api/auth", authRoutes);
app.use("/api/sessions", sessionRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/face", faceRoutes);

// ❌ 404 Handler
app.use(notFound);

// ❌ Global Error Handler
app.use(errorHandler);

// ✅ PORT (Render provides PORT automatically)
const PORT = process.env.PORT || 5000;

// ✅ Start Server
const startServer = async () => {
  try {
    await connectDB();
    console.log("✅ MongoDB Connected");

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("❌ Server start failed:", error);
    process.exit(1);
  }
};

startServer();