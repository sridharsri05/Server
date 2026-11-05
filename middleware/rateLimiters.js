// middleware/rateLimiters.js
// NOTE: express-rate-limit uses an in-memory store, so on Vercel serverless the counters are per function
// instance (best effort: a cold start or another instance has its own counts). Good enough to blunt brute force
// and scraping; use a shared store (Redis/Upstash) if you need hard guarantees.
const rateLimit = require("express-rate-limit");

const make = (windowMs, limit, message, extra = {}) =>
    rateLimit({
        ...extra,
        windowMs,
        limit,
        standardHeaders: true,
        legacyHeaders: false,
        message: { success: false, status: "error", message },
    });

// Applied to every route.
// The TMDB/OMDb proxy routes have their own (per-minute) limiter, so a page load of many TMDB calls does not eat this budget.
const generalLimiter = make(15 * 60 * 1000, 300, "Too many requests, please try again later.", {
    skip: (req) => req.path.startsWith("/tmdb/") || req.path === "/omdb" || req.path === "/health",
});
// login, signup, googleSignin, forgot-password, reset-password
const authLimiter = make(15 * 60 * 1000, 10, "Too many authentication attempts, please try again in 15 minutes.");
// Routes that fan out to OMDb
const omdbLimiter = make(60 * 1000, 60, "Too many requests, please slow down.");
// TMDB/OMDb proxy routes (/tmdb/*, /omdb)
const mediaProxyLimiter = make(60 * 1000, 120, "Too many requests, please slow down.");

module.exports = { generalLimiter, authLimiter, omdbLimiter, mediaProxyLimiter };
