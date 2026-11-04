const axios = require("axios");
const { resolvePoster } = require("../utils/resolvePoster");

const OMBD_API_KEY = "8d58c823";
// const OMBD_API_KEY = "78532d38";

// imdbId -> { data, expires }. Movie details rarely change; caching makes repeat page loads fast
// and keeps us well under OMDb's daily request limit.
const omdbCache = new Map();
const OMDB_TTL_MS = 6 * 60 * 60 * 1000;

const getOmdbDetails = async (imdbId) => {
    const hit = omdbCache.get(imdbId);
    if (hit && hit.expires > Date.now()) return { ...hit.data };

    const { data } = await axios.get(
        `https://www.omdbapi.com/?apikey=${OMBD_API_KEY}&i=${imdbId}`,
        { timeout: 10000 }
    );
    if (data.Response !== "False") {
        omdbCache.set(imdbId, { data, expires: Date.now() + OMDB_TTL_MS });
    }
    return { ...data };
};

// Fetches OMDb details for each IMDb ID in req.body.imdbIds and ensures Poster is a working URL (or null).
// Clients send a whole page of IDs in one request, so one bad ID is skipped instead of failing the batch.
const fetchTitlesWithPosters = async (req, res) => {
    const imdbIds = Array.isArray(req.body?.imdbIds) ? req.body.imdbIds : [];
    try {
        const movieDetails = await Promise.all(
            imdbIds.map(async (imdbId) => {
                try {
                    const data = await getOmdbDetails(imdbId);
                    if (data.Response === "False") return null;
                    data.Poster = await resolvePoster(imdbId, data.Poster);
                    return data;
                } catch (error) {
                    console.error(`OMDb lookup failed for ${imdbId}:`, error.message);
                    return null;
                }
            })
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
