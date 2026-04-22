const jwt = require("jsonwebtoken");
const User = require("../models/User");

async function protect(req, res, next) {
  try {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (!token) {
      res.status(401);
      throw new Error("Not authorized, missing token.");
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      res.status(401);
      throw new Error("Not authorized, user not found.");
    }

    req.user = user;
    next();
  } catch (err) {
    res.status(401);
    next(err);
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      res.status(401);
      return next(new Error("Not authorized."));
    }
    if (!roles.includes(req.user.role)) {
      res.status(403);
      return next(new Error("Forbidden: insufficient role."));
    }
    return next();
  };
}

module.exports = { protect, requireRole };

