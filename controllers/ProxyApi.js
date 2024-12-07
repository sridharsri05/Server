const axios = require('axios');
const { createProxyMiddleware } = require('http-proxy-middleware');
const config = require('../config')

const backendApiUrl = "https://vidsrc.xyz";



const proxyApi = async (req, res) => {
    try {
        const { page } = req.params;

        // The ScraperAPI URL with the original URL as a query parameter
        const response = await axios.get('http://api.scraperapi.com', {
            params: {
                api_key: config.SCRAPER_API_KEY,
                url: `${backendApiUrl}/movies/latest/page-${page}.json`
            }
        });

        res.json(response.data);
    } catch (error) {
        console.error({ error });
        res.status(500).json({ error: 'proxy movie server error', error });
    }
};

const proxyAddMovies = async (req, res) => {
    try {
        const { page } = req.params;
        const response = await axios.get(`${backendApiUrl}/vapi/movie/add/${page}`);
        res.json(response.data);
    } catch (error) {
        console.error({ error });
        res.status(500).json({ error: 'proxy addMovie server error', error });
    }
}
const proxyTvApi = async (req, res) => {
    try {
        const { page } = req.params;
        const response = await axios.get(`${backendApiUrl}/vapi/tv/new/${page}`);
        res.json(response.data);
    } catch (error) {
        console.error({ error });
        res.status(500).json({ error: ' proxyTv server error', error });
    }
}
const proxyTvAdd = async (req, res) => {
    try {
        const { page } = req.params;

        // The ScraperAPI URL with the original URL as a query parameter
        const response = await axios.get('http://api.scraperapi.com', {
            params: {
                api_key: config.SCRAPER_API_KEY,
                url: `${backendApiUrl}/tvshows/latest/page-${page}.json`
            },
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });

        res.json(response.data);
    } catch (error) {
        console.error({ error });
        res.status(500).json({ error: 'proxyTv server error', error });
    }
};


// module.exports = { apiProxy, proxyApi, proxyAddMovies, proxyTvAdd, proxyTvApi }
module.exports = { proxyApi, proxyAddMovies, proxyTvAdd, proxyTvApi }


