// routes/mediaProxy.js - server-side proxy for TMDB and OMDb so API keys never reach the browser
// (and clients whose ISP blocks api.themoviedb.org still get data via this server).
const express = require("express");
const axios = require("axios");
const config = require("../config");
const { BoundedCache } = require("../utils/boundedCache");
const { mediaProxyLimiter } = require("../middleware/rateLimiters");

const router = express.Router();

const TMDB_BASE = "https://api.themoviedb.org/3/";
const OMDB_BASE = "https://www.omdbapi.com/";
const TIMEOUT_MS = 10000;
const LIST_TTL_MS = 60 * 60 * 1000; // lists: trending / discover / search / popular
const DETAIL_TTL_MS = 6 * 60 * 60 * 1000; // details
const CACHE_CONTROL = "public, s-maxage=3600, stale-while-revalidate=86400";

const TMDB_ALLOWED_PREFIXES = ["movie/", "tv/", "find/", "trending/", "discover/", "search/", "watch/providers/", "genre/"];
const OMDB_ALLOWED_PARAMS = ["i", "t", "s", "page", "type", "y", "plot"];
const SAFE_PATH_RE = /^[A-Za-z0-9_\-/.]+$/; // also rules out ":" (absolute URLs), "\", "?", "#", "%"
const LIST_PATH_RE = /^(trending|discover|search)\/|^(movie|tv)\/(popular|top_rated|now_playing|upcoming|on_the_air|airing_today)$/;

const cache = new BoundedCache(1000); // key -> { data, expires } (LRU)

const fail = (res, status, message) => res.status(status).json({ success: false, message });

const cacheKey = (prefix, path, params) => {
    const qs = Object.keys(params)
        .sort()
        .map((k) => `${k}=${params[k]}`)
        .join("&");
    return `${prefix}:${path}?${qs}`;
};

// Fetches upstream (or serves from cache) and writes the response. `logName` is safe to log (no key).
const forward = async (res, { url, params, key, ttl, logName }) => {
    const hit = cache.get(key);
    if (hit && hit.expires > Date.now()) {
        res.set("X-Cache", "HIT").set("Cache-Control", CACHE_CONTROL);
        return res.json(hit.data);
    }
    try {
        const upstream = await axios.get(url, { params, timeout: TIMEOUT_MS, validateStatus: () => true });
        if (upstream.status >= 200 && upstream.status < 300) {
            // OMDb answers 200 with {Response:"False"} for misses; don't cache or edge-cache those.
            const ok = !(upstream.data && upstream.data.Response === "False");
            if (ok) {
                cache.set(key, { data: upstream.data, expires: Date.now() + ttl });
                res.set("Cache-Control", CACHE_CONTROL);
            }
            return res.set("X-Cache", "MISS").json(upstream.data);
        }
        const msg = (upstream.data && (upstream.data.status_message || upstream.data.Error)) || "Upstream request failed";
        return fail(res, upstream.status, String(msg));
    } catch (error) {
        // Log only code/name: axios error objects/messages can embed the request config (and key).
        console.error(`${logName} proxy error:`, error.code || error.name);
        const timedOut = error.code === "ECONNABORTED" || error.code === "ETIMEDOUT";
        return fail(res, timedOut ? 504 : 502, timedOut ? "Upstream request timed out" : "Upstream request failed");
    }
};

router.get("/tmdb/*", mediaProxyLimiter, (req, res) => {
    const path = req.params[0] || "";
    if (
        !SAFE_PATH_RE.test(path) ||
        path.includes("..") ||
        path.includes("//") ||
        !TMDB_ALLOWED_PREFIXES.some((p) => path.startsWith(p))
    ) {
        return fail(res, 400, "Path not allowed");
    }
    const params = {};
    for (const [k, v] of Object.entries(req.query)) {
        if (k.toLowerCase().replace(/[^a-z]/g, "") === "apikey") return fail(res, 400, "api_key must not be supplied");
        if (typeof v !== "string") return fail(res, 400, "Invalid query parameter");
        params[k] = v;
    }
    return forward(res, {
        url: TMDB_BASE + path,
        params: { ...params, api_key: config.TMDB_API_KEY },
        key: cacheKey("tmdb", path, params),
        ttl: LIST_PATH_RE.test(path) ? LIST_TTL_MS : DETAIL_TTL_MS,
        logName: "TMDB",
    });
});

router.get("/omdb", mediaProxyLimiter, (req, res) => {
    const params = {};
    for (const k of OMDB_ALLOWED_PARAMS) {
        const v = req.query[k];
        if (v === undefined) continue;
        if (typeof v !== "string") return fail(res, 400, "Invalid query parameter");
        params[k] = v;
    }
    return forward(res, {
        url: OMDB_BASE,
        params: { ...params, apikey: config.OMDB_API_KEY },
        key: cacheKey("omdb", "", params),
        ttl: params.s !== undefined ? LIST_TTL_MS : DETAIL_TTL_MS,
        logName: "OMDb",
    });
});

module.exports = router;
