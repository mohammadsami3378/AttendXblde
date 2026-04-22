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
  // Add safe defaults if user didn't include them.
  // (Does not override if already present.)
  try {
    const u = new URL(uri);
    if (!u.searchParams.has("retryWrites")) u.searchParams.set("retryWrites", "true");
    if (!u.searchParams.has("w")) u.searchParams.set("w", "majority");
    return u.toString();
  } catch {
    return uri;
  }
}

async function connectDB() {
  const rawUri = process.env.MONGODB_URI;
  const uri = ensureAtlasDefaults(rawUri);
  if (!uri) {
    throw new Error("MONGODB_URI is missing in environment variables.");
  }

  // Windows + some routers/ISPs can cause Node's SRV lookup to fail even when the OS resolver works.
  // For mongodb+srv:// URIs, force Node to use public DNS servers unless the user overrides.
  if (uri.startsWith("mongodb+srv://")) {
    const servers = process.env.DNS_SERVERS
      ? process.env.DNS_SERVERS.split(",").map((s) => s.trim()).filter(Boolean)
      : ["1.1.1.1", "8.8.8.8"];
    try {
      dns.setServers(servers);
    } catch (e) {
      // ignore
    }
  }

  mongoose.set("strictQuery", true);

  try {
    await mongoose.connect(uri, {
      autoIndex: true,
      serverSelectionTimeoutMS: 12_000,
      connectTimeoutMS: 12_000,
      socketTimeoutMS: 45_000,
    });
  } catch (err) {
    const base = `MongoDB connection failed for ${redactMongoUri(uri)}`;
    const msg = String(err?.message || err || "");
    const hint =
      msg.includes("whitelisted") || msg.includes("IP")
        ? "Atlas IP Access List is blocking this machine. In MongoDB Atlas → Network Access → IP Access List, add your current IP (or temporarily allow 0.0.0.0/0 for testing)."
        : msg.includes("ENOTFOUND") || msg.includes("querySrv")
          ? "DNS SRV lookup failed. Try setting DNS_SERVERS=1.1.1.1,8.8.8.8 in server/.env or switch networks."
          : "Check your cluster status, username/password, and that the DB user has access to the target database.";
    throw new Error(`${base}. ${hint}`);
  }

  // eslint-disable-next-line no-console
  console.log(`MongoDB connected: ${mongoose.connection.host} / db=${mongoose.connection.name}`);
}

module.exports = { connectDB };

