// Placeholder for future OpenCV / face-recognition integration.
// In production you might:
// - Detect face on-device (frontend) and send embeddings
// - Or upload an image to server, run OpenCV/DeepFace, compare to stored profile embeddings

async function verifyFace(req, res) {
  // For now we just return a stub response so the system remains runnable.
  res.json({
    ok: true,
    implemented: false,
    message: "Face verification is a placeholder. Integrate OpenCV here.",
  });
}

module.exports = { verifyFace };

