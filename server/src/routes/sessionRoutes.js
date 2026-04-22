const express = require("express");
const { protect, requireRole } = require("../middleware/auth");
const { generateDailySession, getActiveSession } = require("../controllers/sessionController");

const router = express.Router();

router.post("/generate", protect, requireRole("admin"), generateDailySession);
router.get("/active", protect, requireRole("admin"), getActiveSession);

module.exports = router;

