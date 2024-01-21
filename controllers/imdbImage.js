// controllers/imdbImage.js
const axios = require('axios');
const cheerio = require('cheerio');

const imdbImage = async (req, res) => {
    const { imdbId, title } = req.body; // Use req.body instead of req.params for POST requests

    try {
        const imdbUrl = `https://www.imdb.com/title/${imdbId}/`;
        console.log('Fetching IMDb URL:', imdbUrl);

        const response = await axios.get(imdbUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3',
            },
        });

        // console.log('IMDb Response:', response.data);

        const $ = cheerio.load(response.data);
        const imageUrl = $('div.ipc-media img').filter((index, element) => {
            const altText = $(element).attr('alt').toLowerCase();
            const titleLowerCase = title.toLowerCase();
            return altText === titleLowerCase;
        }).attr('src');
        console.log("IMDB ", imageUrl)

        res.status(200).json({ imageUrl, status: 'success' });
    } catch (error) {
        console.error('Error fetching IMDb image:', error.response?.status, error.message, error.response?.data);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

module.exports = {
    imdbImage,
};
