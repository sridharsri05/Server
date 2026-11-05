// utils/validate.js - tiny request validation helpers (guards against NoSQL operator injection).
const OBJECT_ID_RE = /^[a-f\d]{24}$/i;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const isString = (v) => typeof v === "string";
const isNonEmptyString = (v, max = 1000) => typeof v === "string" && v.length > 0 && v.length <= max;
const isEmail = (v) => typeof v === "string" && v.length <= 254 && EMAIL_RE.test(v);
const isObjectId = (v) => typeof v === "string" && OBJECT_ID_RE.test(v);

// Sends a 400 and returns true when `value` is not a plain string (objects/arrays/numbers rejected).
const badRequest = (res, message) => res.status(400).json({ status: "error", success: false, message });

module.exports = { isString, isNonEmptyString, isEmail, isObjectId, badRequest };
