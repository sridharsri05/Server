const axios = require('axios');
const config = require('../config');

const CACHE_OK = 'public, s-maxage=600, stale-while-revalidate=3600';
const sendCached = (res, data) => {
    res.set('Cache-Control', CACHE_OK);
    res.json(data);
};

/**
 * Try fetching a path from the primary domain first, then fallbacks.
 * Returns the first successful response.
 */
async function fetchWithFallback(pathFn, options = {}) {
    const domains = [config.VIDSRC_DOMAIN, ...config.VIDSRC_FALLBACKS];
    const errors = [];

    for (const domain of domains) {
        const url = pathFn(domain);
        try {
            const response = await axios.get(url, { timeout: 5000, ...options });
            if (response.data) {
                console.log(`✅ Success from: ${domain}`);
                return response;
            }
        } catch (err) {
            console.warn(`⚠️ Failed from ${domain}: ${err.message}`);
            errors.push({ domain, message: err.message });
        }
    }

    throw new Error(`All domains failed: ${JSON.stringify(errors)}`);
}

const proxyApi = async (req, res) => {
    const { page } = req.params;

    try {
        const result = await fetchWithFallback(
            (domain) => `${domain}/movies/latest/page-${page}.json`
        );
        sendCached(res, result.data);
    } catch (err) {
        console.error("❌ All sources failed for movies:", err.message);
        res.set('Cache-Control', 'no-store').status(500).json({
            error: 'proxy movie server error',
            messages: [err.message],
        });
    }
};

const proxyAddMovies = async (req, res) => {
    const { page } = req.params;

    try {
        const result = await fetchWithFallback(
            (domain) => `${domain}/vapi/movie/add/${page}`
        );
        sendCached(res, result.data);
    } catch (err) {
        console.error("❌ All sources failed for addMovies:", err.message);
        res.set('Cache-Control', 'no-store').status(500).json({ error: 'proxy addMovie server error', message: err.message });
    }
};

const proxyTvApi = async (req, res) => {
    const { page } = req.params;

    try {
        const result = await fetchWithFallback(
            (domain) => `${domain}/vapi/tv/new/${page}`
        );
        sendCached(res, result.data);
    } catch (err) {
        console.error("❌ All sources failed for TV:", err.message);
        res.set('Cache-Control', 'no-store').status(500).json({ error: 'proxyTv server error', message: err.message });
    }
};

const proxyTvAdd = async (req, res) => {
    const { page } = req.params;

    try {
        const result = await fetchWithFallback(
            (domain) => `${domain}/tvshows/latest/page-${page}.json`,
            {
                headers: {
                    'User-Agent':
                        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                },
            }
        );
        sendCached(res, result.data);
    } catch (err) {
        console.error("❌ All sources failed for proxyTvAdd:", err.message);
        res.set('Cache-Control', 'no-store').status(500).json({
            error: 'proxyTvAdd server error',
            message: err.message,
        });
    }
};

module.exports = { proxyApi, proxyAddMovies, proxyTvAdd, proxyTvApi };
