const express = require("express");
const multer = require("multer");
const { protect } = require("../middleware/auth");
const { verifyFace } = require("../controllers/faceController");

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
});

// POST /api/face/verify
// Accepts either:
// - multipart/form-data with field "image"
// - OR JSON base64 (future)
router.post("/verify", protect, upload.single("image"), verifyFace);

module.exports = router;

