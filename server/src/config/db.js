const mongoose = require("mongoose");
const dns = require("dns");

function redactMongoUri(uri) {
  try {
    const u = new URL(uri);
    if (u.username) u.username = "****";
    if (u.password) u.password = "****";
    return u.toString();
  } catch {
    return "<invalid-mongodb-uri>";
  }
}

function ensureAtlasDefaults(uri) {
  if (!uri || !uri.startsWith("mongodb")) return uri;

  try {
    const u = new URL(uri);

    if (!u.searchParams.has("retryWrites")) {
      u.searchParams.set("retryWrites", "true");
    }

    if (!u.searchParams.has("w")) {
      u.searchParams.set("w", "majority");
    }

    return u.toString();
  } catch {
    return uri;
  }
}

async function connectDB() {
  const rawUri = process.env.MONGO_URI; // ✅ FIXED (standard name)
  const uri = ensureAtlasDefaults(rawUri);

  if (!uri) {
    throw new Error("❌ MONGO_URI is missing in environment variables.");
  }

  // ✅ DNS fix (safe for Render too)
  if (uri.startsWith("mongodb+srv://")) {
    try {
      dns.setServers(["1.1.1.1", "8.8.8.8"]);
    } catch {}
  }

  mongoose.set("strictQuery", true);

  try {
    await mongoose.connect(uri, {
      autoIndex: false, // ✅ better for production
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });

    console.log(`✅ MongoDB connected: ${mongoose.connection.host}`);
  } catch (err) {
    const base = `❌ MongoDB connection failed for ${redactMongoUri(uri)}`;
    const msg = String(err?.message || err || "");

    let hint = "";

    if (msg.includes("IP") || msg.includes("whitelist")) {
      hint =
        "➡ Fix: Go to MongoDB Atlas → Network Access → Add IP → allow 0.0.0.0/0 (for testing)";
    } else if (msg.includes("ENOTFOUND") || msg.includes("querySrv")) {
      hint =
        "➡ DNS issue: Ensure internet works OR use non-SRV Mongo URI";
    } else {
      hint =
        "➡ Check username/password and database access";
    }

    throw new Error(`${base}\n${hint}`);
  }
}

module.exports = { connectDB };