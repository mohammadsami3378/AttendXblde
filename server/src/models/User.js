const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    password: { type: String, required: true, minlength: 6 },
    role: { type: String, enum: ["admin", "student"], default: "student" },
    // Students only
    usn: {
      type: String,
      trim: true,
      uppercase: true,
      required: function requiredUsn() {
        return this.role === "student";
      },
    },
    // Admins only
    adminId: {
      type: String,
      trim: true,
      required: function requiredAdminId() {
        return this.role === "admin";
      },
    },
  },
  { timestamps: true }
);

// Unique per-role identifiers (prevents sparse-unique edge cases)
userSchema.index(
  { usn: 1 },
  {
    unique: true,
    partialFilterExpression: { role: "student", usn: { $type: "string" } },
  }
);
userSchema.index(
  { adminId: 1 },
  {
    unique: true,
    partialFilterExpression: { role: "admin", adminId: { $type: "string" } },
  }
);

userSchema.pre("save", async function passwordHash() {
  if (!this.isModified("password")) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.matchPassword = async function matchPassword(plain) {
  return bcrypt.compare(plain, this.password);
};

module.exports = mongoose.model("User", userSchema);

