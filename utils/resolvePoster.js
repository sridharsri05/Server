const axios = require("axios");
const { imdbImage } = require("../controllers/imdbImage");
const { TMDB_API_KEY } = require("../config");
const { BoundedCache } = require("./boundedCache");

const TMDB_IMG = "https://image.tmdb.org/t/p/w500";

// imdbId -> resolved poster URL (or null). Avoids re-checking on every page load.
// Size-capped (LRU) so a long-lived instance can't grow without bound.
const cache = new BoundedCache(2000);

// OMDb often returns stale m.media-amazon.com links that 404, so verify before trusting.
const isImageReachable = async (url) => {
    try {
        const res = await axios.head(url, { timeout: 5000, validateStatus: () => true });
        return res.status >= 200 && res.status < 300;
    } catch {
        return false;
    }
};

const tmdbPoster = async (imdbId) => {
    if (!TMDB_API_KEY) return null;
    try {
        const { data } = await axios.get(`https://api.themoviedb.org/3/find/${imdbId}`, {
            params: { api_key: TMDB_API_KEY, external_source: "imdb_id" },
            timeout: 8000,
        });
        const hit = [...(data.movie_results || []), ...(data.tv_results || [])].find((r) => r.poster_path);
        return hit ? `${TMDB_IMG}${hit.poster_path}` : null;
    } catch (error) {
        console.error(`TMDB poster lookup failed for ${imdbId}:`, error.message);
        return null;
    }
};

// Returns a working poster URL for the title, or null if none can be found.
const resolvePoster = async (imdbId, omdbPoster) => {
    if (cache.has(imdbId)) return cache.get(imdbId);

    let poster = null;
    if (omdbPoster && omdbPoster !== "N/A" && (await isImageReachable(omdbPoster))) {
        poster = omdbPoster;
    } else {
        poster = await tmdbPoster(imdbId);
        if (!poster) {
            // Last resort; IMDb currently blocks most non-browser requests.
            const scraped = await imdbImage(imdbId);
            poster = scraped.status === "success" ? scraped.imageUrl : null;
        }
    }

    cache.set(imdbId, poster);
    return poster;
};

module.exports = { resolvePoster };
