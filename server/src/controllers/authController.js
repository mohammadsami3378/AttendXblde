const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { z } = require("zod");

function signToken(id) {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });
}

function zodErrorToMessage(err) {
  if (!(err instanceof z.ZodError)) return null;
  const first = err.issues?.[0];
  if (!first) return "Invalid input.";
  const path = first.path?.length ? first.path.join(".") : "input";
  return `${path}: ${first.message}`;
}

const emailSchema = z.string().email().transform((v) => v.toLowerCase().trim());

const registerBodySchema = z.object({
  name: z.string().min(1, "Full name is required.").transform((v) => v.trim()),
  email: emailSchema,
  password: z.string().min(6, "Password must be at least 6 characters."),
  role: z.enum(["admin", "student"]).optional(),
  usn: z.string().min(1, "USN is required.").transform((v) => v.trim().toUpperCase()).optional(),
  adminId: z.string().min(1, "adminId is required.").transform((v) => v.trim()).optional(),
});

const loginBodySchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required."),
  role: z.enum(["admin", "student"]),
  usn: z.string().min(1, "USN is required.").transform((v) => v.trim().toUpperCase()).optional(),
  adminId: z.string().min(1, "adminId is required.").transform((v) => v.trim()).optional(),
});

// POST /api/auth/register
async function register(req, res, next) {
  try {
    const parsed = registerBodySchema.parse(req.body || {});
    const { name, email, password } = parsed;

    // eslint-disable-next-line no-console
    console.log("[auth.register] start", { email, roleRequested: parsed.role || "student" });

    const existing = await User.findOne({ email });
    if (existing) {
      res.status(400);
      throw new Error("Email already registered.");
    }

    let finalRole = "student";
    const roleRequested = parsed.role === "admin" ? "admin" : "student";
    const bootstrapSecret = process.env.ADMIN_BOOTSTRAP_SECRET;
    const providedSecret = req.headers["x-admin-secret"];
    const allowAdmin =
      roleRequested === "admin" && bootstrapSecret && String(providedSecret || "") === bootstrapSecret;

    if (roleRequested === "admin" && !allowAdmin) {
      res.status(403);
      throw new Error("Admin registration is not allowed without a valid bootstrap secret.");
    }
    if (allowAdmin) finalRole = "admin";

    if (finalRole === "student") {
      if (!parsed.usn) {
        res.status(400);
        throw new Error("usn is required for student registration.");
      }
      const usnExists = await User.findOne({ usn: parsed.usn });
      if (usnExists) {
        res.status(400);
        throw new Error("USN already registered.");
      }
    }

    if (finalRole === "admin") {
      if (!parsed.adminId) {
        res.status(400);
        throw new Error("adminId is required for admin registration.");
      }
      const adminIdExists = await User.findOne({ adminId: parsed.adminId });
      if (adminIdExists) {
        res.status(400);
        throw new Error("adminId already registered.");
      }
    }

    const user = await User.create(
      finalRole === "admin"
        ? { name, email, password: String(password), role: finalRole, adminId: parsed.adminId }
        : { name, email, password: String(password), role: finalRole, usn: parsed.usn }
    );

    // eslint-disable-next-line no-console
    console.log("[auth.register] saved", { id: String(user._id), role: user.role, email: user.email });

    res.status(201).json({
      token: signToken(user._id),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        usn: user.usn,
        adminId: user.adminId,
      },
    });
  } catch (err) {
    const msg = zodErrorToMessage(err);
    if (msg) {
      res.status(400);
      return next(new Error(msg));
    }
    next(err);
  }
}

// POST /api/auth/login
async function login(req, res, next) {
  try {
    const parsed = loginBodySchema.parse(req.body || {});

    // eslint-disable-next-line no-console
    console.log("[auth.login] start", { email: parsed.email, role: parsed.role });

    if (parsed.role === "student" && !parsed.usn) {
      res.status(400);
      throw new Error("usn is required for student login.");
    }
    if (parsed.role === "admin" && !parsed.adminId) {
      res.status(400);
      throw new Error("adminId is required for admin login.");
    }

    const user = await User.findOne({ email: parsed.email });
    if (!user) {
      res.status(401);
      throw new Error("Invalid credentials.");
    }

    if (user.role !== parsed.role) {
      res.status(401);
      throw new Error("Invalid credentials.");
    }

    if (parsed.role === "student") {
      if (!user.usn || user.usn !== parsed.usn) {
        res.status(401);
        throw new Error("Invalid credentials.");
      }
    } else if (parsed.role === "admin") {
      if (!user.adminId || user.adminId !== parsed.adminId) {
        res.status(401);
        throw new Error("Invalid credentials.");
      }
    }

    const ok = await user.matchPassword(String(parsed.password));
    if (!ok) {
      res.status(401);
      throw new Error("Invalid credentials.");
    }

    // eslint-disable-next-line no-console
    console.log("[auth.login] ok", { id: String(user._id), role: user.role, email: user.email });

    res.json({
      token: signToken(user._id),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        usn: user.usn,
        adminId: user.adminId,
      },
    });
  } catch (err) {
    const msg = zodErrorToMessage(err);
    if (msg) {
      res.status(400);
      return next(new Error(msg));
    }
    next(err);
  }
}

// GET /api/auth/me
async function me(req, res) {
  res.json({ user: req.user });
}

module.exports = { register, login, me };

