// controllers/libraryController.js
const Library = require("../models/Library");

const LISTS = ["watchlist", "liked"];
const HISTORY_CAP = 100;
const IMDB_RE = /^[A-Za-z0-9_-]{1,32}$/;

const bad = (res, message) => res.status(400).json({ success: false, message });

// The token payload is { userId: { _id, ... }, role } (see authController / jwtUtils).
const userKey = (req) => {
    const u = req.user && req.user.userId;
    const id = u && typeof u === "object" ? u._id : u;
    return id ? String(id) : null;
};
const noUser = (res) => res.status(401).json({ error: "Unauthorized", message: "token has no user" });

const str = (v, max) => (typeof v === "string" ? v.trim().slice(0, max) : "");

// Validates an item body; returns { item } or { error }.
function parseItem(body, withProgress) {
    if (!body || typeof body !== "object") return { error: "Request body is required" };
    const imdbId = str(body.imdbId, 32);
    if (!IMDB_RE.test(imdbId)) return { error: "imdbId is required (e.g. tt0111161)" };
    if (body.type !== "movie" && body.type !== "tv") return { error: 'type must be "movie" or "tv"' };
    const item = {
        imdbId,
        type: body.type,
        title: str(body.title, 300),
        poster: str(body.poster, 1000),
        year: str(body.year, 20),
    };
    if (withProgress && body.type === "tv" && body.season != null && body.episode != null) {
        const season = Number(body.season);
        const episode = Number(body.episode);
        if (!Number.isInteger(season) || !Number.isInteger(episode) || season < 0 || episode < 0 || season > 1000 || episode > 10000) {
            return { error: "season and episode must be non-negative integers" };
        }
        item.season = season;
        item.episode = episode;
    }
    return { item };
}

// Make sure the user's document exists (safe under concurrent first requests).
async function ensure(user) {
    try {
        await Library.updateOne({ user }, { $setOnInsert: { user } }, { upsert: true });
    } catch (e) {
        if (e.code !== 11000) throw e;
    }
}

const fail = (res, err) => {
    console.error("Library error:", err.message);
    return res.status(500).json({ success: false, message: "Could not process library request" });
};

exports.getLibrary = async (req, res) => {
    try {
        const user = userKey(req);
        if (!user) return noUser(res);
        const doc = await Library.findOne({ user }).lean();
        res.json({
            watchlist: doc ? doc.watchlist : [],
            liked: doc ? doc.liked : [],
            history: doc ? doc.history : [],
        });
    } catch (err) {
        fail(res, err);
    }
};

exports.addToList = async (req, res) => {
    try {
        const user = userKey(req);
        if (!user) return noUser(res);
        const { list } = req.params;
        if (!LISTS.includes(list)) return bad(res, "list must be watchlist or liked");
        const { item, error } = parseItem(req.body, false);
        if (error) return bad(res, error);
        item.addedAt = new Date();
        await ensure(user);
        // Only pushes when the imdbId is not there yet -> idempotent.
        await Library.updateOne(
            { user, [`${list}.imdbId`]: { $ne: item.imdbId } },
            { $push: { [list]: { $each: [item], $position: 0 } } }
        );
        const doc = await Library.findOne({ user }).lean();
        res.json({ success: true, [list]: doc[list] });
    } catch (err) {
        fail(res, err);
    }
};

exports.removeFromList = async (req, res) => {
    try {
        const user = userKey(req);
        if (!user) return noUser(res);
        const { list, imdbId } = req.params;
        if (!LISTS.includes(list)) return bad(res, "list must be watchlist or liked");
        if (!IMDB_RE.test(imdbId)) return bad(res, "invalid imdbId");
        await Library.updateOne({ user }, { $pull: { [list]: { imdbId } } });
        const doc = await Library.findOne({ user }).lean();
        res.json({ success: true, [list]: doc ? doc[list] : [] });
    } catch (err) {
        fail(res, err);
    }
};

exports.upsertHistory = async (req, res) => {
    try {
        const user = userKey(req);
        if (!user) return noUser(res);
        const { item, error } = parseItem(req.body, true);
        if (error) return bad(res, error);
        item.watchedAt = new Date();
        await ensure(user);
        await Library.updateOne({ user }, { $pull: { history: { imdbId: item.imdbId } } });
        await Library.updateOne(
            { user },
            { $push: { history: { $each: [item], $position: 0, $slice: HISTORY_CAP } } }
        );
        const doc = await Library.findOne({ user }).lean();
        res.json({ success: true, history: doc.history });
    } catch (err) {
        fail(res, err);
    }
};

exports.removeHistoryItem = async (req, res) => {
    try {
        const user = userKey(req);
        if (!user) return noUser(res);
        const { imdbId } = req.params;
        if (!IMDB_RE.test(imdbId)) return bad(res, "invalid imdbId");
        await Library.updateOne({ user }, { $pull: { history: { imdbId } } });
        const doc = await Library.findOne({ user }).lean();
        res.json({ success: true, history: doc ? doc.history : [] });
    } catch (err) {
        fail(res, err);
    }
};

exports.clearHistory = async (req, res) => {
    try {
        const user = userKey(req);
        if (!user) return noUser(res);
        await Library.updateOne({ user }, { $set: { history: [] } });
        res.json({ success: true, history: [] });
    } catch (err) {
        fail(res, err);
    }
};
