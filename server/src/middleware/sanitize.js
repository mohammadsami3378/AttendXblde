function sanitizeObject(obj) {
  if (!obj || typeof obj !== "object") return;

  // Arrays: sanitize each item
  if (Array.isArray(obj)) {
    for (const item of obj) sanitizeObject(item);
    return;
  }

  // Plain objects: remove Mongo operator/dot keys recursively
  for (const key of Object.keys(obj)) {
    if (key.startsWith("$") || key.includes(".")) {
      // eslint-disable-next-line no-param-reassign
      delete obj[key];
      // eslint-disable-next-line no-continue
      continue;
    }
    sanitizeObject(obj[key]);
  }
}

function sanitizeMongoInputs(req, res, next) {
  // Express 5 exposes req.query via a getter; mutating properties is OK, reassigning is not.
  sanitizeObject(req.body);
  sanitizeObject(req.params);
  sanitizeObject(req.query);
  next();
}

module.exports = { sanitizeMongoInputs };

