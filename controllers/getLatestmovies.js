const axios = require("axios");
const mongoose = require("mongoose");
const OmdbCache = require("../models/OmdbCache");
const { resolvePoster } = require("../utils/resolvePoster");
const { BoundedCache } = require("../utils/boundedCache");

const MAX_IDS = 60; // max imdbIds accepted per request
const CONCURRENCY = 8; // max simultaneous OMDb requests per request
const ID_RE = /^[A-Za-z0-9_-]{1,32}$/;

// Runs fn over items with at most `limit` in flight; preserves order.
const mapPool = async (items, limit, fn) => {
    const results = new Array(items.length);
    let next = 0;
    const worker = async () => {
        while (next < items.length) {
            const i = next++;
            results[i] = await fn(items[i]);
        }
    };
    await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
    return results;
};

const { OMDB_API_KEY: OMBD_API_KEY } = require("../config");
// const OMBD_API_KEY = "78532d38";

// imdbId -> { data, expires }. Movie details rarely change; caching makes repeat page loads fast
// and keeps us well under OMDb's daily request limit.
const omdbCache = new BoundedCache(2000); // size-capped (LRU)
const OMDB_TTL_MS = 6 * 60 * 60 * 1000;

const MONGO_TIMEOUT_MS = 2000; // Mongo is only a cache: never let it slow a request down

const withTimeout = (promise, ms) =>
    Promise.race([promise, new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), ms))]);

// One bulk query for the ids not in memory. Fails open: returns an empty Map if Mongo is down or slow.
const loadFromMongo = async (ids) => {
    const found = new Map();
    if (!ids.length || mongoose.connection.readyState !== 1) return found;
    try {
        const docs = await withTimeout(
            OmdbCache.find({ imdbId: { $in: ids }, expiresAt: { $gt: new Date() } })
                .maxTimeMS(MONGO_TIMEOUT_MS)
                .lean(),
            MONGO_TIMEOUT_MS
        );
        for (const d of docs) found.set(d.imdbId, d.data);
    } catch (error) {
        console.warn("OMDb Mongo cache read skipped:", error.message);
    }
    return found;
};

// Fire-and-forget write-through; errors are only logged.
const saveToMongo = (imdbId, data) => {
    if (mongoose.connection.readyState !== 1) return;
    OmdbCache.updateOne(
        { imdbId },
        { $set: { data, expiresAt: new Date(Date.now() + OMDB_TTL_MS) } },
        { upsert: true }
    )
        .maxTimeMS(MONGO_TIMEOUT_MS)
        .catch((error) => console.warn("OMDb Mongo cache write skipped:", error.message));
};

// Lookup order: memory -> Mongo (prefetched in bulk) -> OMDb. Cached values already contain the resolved Poster.
// Returns the final movie object, or null when OMDb has no such title.
const getOmdbDetails = async (imdbId, mongoHits) => {
    const hit = omdbCache.get(imdbId);
    if (hit && hit.expires > Date.now()) {
        console.log(`[omdb-cache] ${imdbId} memory`);
        return { ...hit.data };
    }

    const fromMongo = mongoHits.get(imdbId);
    if (fromMongo) {
        console.log(`[omdb-cache] ${imdbId} mongo`);
        omdbCache.set(imdbId, { data: fromMongo, expires: Date.now() + OMDB_TTL_MS });
        return { ...fromMongo };
    }

    console.log(`[omdb-cache] ${imdbId} omdb`);
    const { data } = await axios.get(
        `https://www.omdbapi.com/?apikey=${OMBD_API_KEY}&i=${imdbId}`,
        { timeout: 10000 }
    );
    if (data.Response === "False") return null;
    data.Poster = await resolvePoster(imdbId, data.Poster);
    omdbCache.set(imdbId, { data, expires: Date.now() + OMDB_TTL_MS });
    saveToMongo(imdbId, data);
    return { ...data };
};

// Fetches OMDb details for each IMDb ID in req.body.imdbIds and ensures Poster is a working URL (or null).
// Clients send a whole page of IDs in one request, so one bad ID is skipped instead of failing the batch.
const fetchTitlesWithPosters = async (req, res) => {
    const raw = req.body?.imdbIds;
    const imdbIds = Array.isArray(raw) ? raw : [];
    if (raw !== undefined && !Array.isArray(raw)) {
        return res.status(400).json({ success: false, message: "imdbIds must be an array of strings" });
    }
    if (imdbIds.length > MAX_IDS) {
        return res.status(400).json({ success: false, message: `imdbIds may contain at most ${MAX_IDS} ids` });
    }
    if (!imdbIds.every((id) => typeof id === "string" && ID_RE.test(id))) {
        return res.status(400).json({ success: false, message: "imdbIds must be an array of valid IMDb id strings" });
    }
    try {
        const uniqueIds = [...new Set(imdbIds)];
        const missing = uniqueIds.filter((id) => {
            const hit = omdbCache.get(id);
            return !(hit && hit.expires > Date.now());
        });
        const mongoHits = await loadFromMongo(missing);
        const movieDetails = await mapPool(
            imdbIds,
            CONCURRENCY,
            async (imdbId) => {
                try {
                    return await getOmdbDetails(imdbId, mongoHits);
                } catch (error) {
                    console.error(`OMDb lookup failed for ${imdbId}:`, error.message);
                    return null;
                }
            }
        );

        res.status(200).json(movieDetails.filter(Boolean));
    } catch (error) {
        console.error("Error fetching movie details:", error);
        res.status(500).send("Internal Server Error");
    }
};

const getLatestMovies = fetchTitlesWithPosters;
const getAddedMovies = fetchTitlesWithPosters;
const getAddedTvshows = fetchTitlesWithPosters;

module.exports = { getLatestMovies, getAddedMovies, getAddedTvshows };
