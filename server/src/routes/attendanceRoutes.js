const express = require("express");
const { protect, requireRole } = require("../middleware/auth");
const { markAttendance, myAttendance } = require("../controllers/attendanceController");

const router = express.Router();

router.post("/mark", protect, requireRole("student"), markAttendance);
router.get("/my", protect, requireRole("student"), myAttendance);

module.exports = router;

