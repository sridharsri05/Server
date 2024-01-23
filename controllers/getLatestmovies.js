

const axios = require('axios');


const OMBD_API_KEY = '8d58c823';

const getLatestMovies = async (req, res) => {
    try {
        // Use Axios to fetch details for each IMDb ID directly from req.body
        const movieDetailsPromises = req.body.imdbIds.map((imdbId) => {
            return axios.get(`http://www.omdbapi.com/?apikey=${OMBD_API_KEY}&i=${imdbId}`);
        });

        const movieDetailsResponses = await Promise.all(movieDetailsPromises);
        const movieDetails = movieDetailsResponses.map((response) => response.data);

        res.json(movieDetails);
    } catch (error) {
        console.error('Error fetching movie details:', error);
        res.status(500).send('Internal Server Error');
    }
};


module.exports = { getLatestMovies } ;