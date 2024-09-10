const axios = require('axios');
const { createProxyMiddleware } = require('http-proxy-middleware');


const backendApiUrl = "https://vidsrc.net";
// const apiProxy = createProxyMiddleware('/api', {
//     target: backendApiUrl,
//     changeOrigin: true,
//     pathRewrite: {
//         '^/api': '', // Remove the '/api' prefix when forwarding the request
//     },
//     logLevel: 'debug', // Enable detailed logging for debugging
//     onProxyReq: (proxyReq, req, res) => {
//         console.log(`Proxying request to: ${proxyReq.path}`);
//     },
//     onError: (err, req, res) => {
//         console.error('Proxy error:', err);
//         res.status(500).json({ error: 'Proxy error', details: err.message });
//     }
// });

const proxyApi = async (req, res) => {
    try {
        const { page } = req.params;
        const response = await axios.get(`${backendApiUrl}/movies/latest/page-${page}.json`);
        res.json(response.data);

    } catch (error) {
        console.error({ error });
        res.status(500).json({ error: 'proxy movie server error', error });
    }
}
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
        const response = await axios.get(`${backendApiUrl}/tvshows/latest/page-${page}.json`);
        res.json(response.data);
    } catch (error) {
        console.error({ error });
        res.status(500).json({ error: 'proxyTv server error', error });
    }
}


// module.exports = { apiProxy, proxyApi, proxyAddMovies, proxyTvAdd, proxyTvApi }
module.exports = { proxyApi, proxyAddMovies, proxyTvAdd, proxyTvApi }


