const axios = require('axios');
const { createProxyMiddleware } = require('http-proxy-middleware');


const backendApiUrl = "https://vidsrc.to/";
const apiProxy = createProxyMiddleware('/api', {
    target: 'https://vidsrc.to/',
    changeOrigin: true,
    pathRewrite: {
        '^/api': '', // Remove the '/api' prefix when forwarding the request
    },
});


const proxyApi = async (req, res) => {
    try {
        const { page } = req.params;
        const response = await axios.get(`${backendApiUrl}/vapi/movie/new/${page}`);
        res.json(response.data);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
}


module.exports = { apiProxy, proxyApi }