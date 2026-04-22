const express = require("express");
const { protect, requireRole } = require("../middleware/auth");
const {
  getSummary,
  listAttendance,
  trends,
  subjectAnalytics,
  exportAttendance,
} = require("../controllers/adminController");

const router = express.Router();

router.get("/summary", protect, requireRole("admin"), getSummary);
router.get("/attendance", protect, requireRole("admin"), listAttendance);
router.get("/trends", protect, requireRole("admin"), trends);
router.get("/subjects", protect, requireRole("admin"), subjectAnalytics);
router.get("/export", protect, requireRole("admin"), exportAttendance);

module.exports = router;

