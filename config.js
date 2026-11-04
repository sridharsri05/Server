require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI;
const JWT_SECRET = process.env.JWT_SECRET;
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASSWORD = process.env.EMAIL_PASSWORD;
const FRONT_END_URL = process.env.FRONT_END_URL;
const SCRAPER_API_KEY = process.env.SCRAPER_API_KEY;
// Used to fill in posters when OMDb's are missing/broken. Defaults to the key the frontend already ships.
const TMDB_API_KEY = process.env.TMDB_API_KEY || "bb666e560f71cab382892f0e4efa696e";

// Primary vidsrc domain — change this in Vercel env vars when the domain changes
// No redeployment needed, just update the env var and redeploy
const VIDSRC_DOMAIN = process.env.VIDSRC_DOMAIN || "https://vidsrc.me";

// Fallback domains to try if the primary fails
const VIDSRC_FALLBACKS = (process.env.VIDSRC_FALLBACKS || "https://vidsrc.net,https://vidsrc.me,https://vidsrc.xyz,https://vidsrc.cc")
    .split(",")
    .map(d => d.trim())
    .filter(Boolean);

module.exports = { MONGODB_URI, JWT_SECRET, EMAIL_USER, EMAIL_PASSWORD, FRONT_END_URL, SCRAPER_API_KEY, TMDB_API_KEY, VIDSRC_DOMAIN, VIDSRC_FALLBACKS };
