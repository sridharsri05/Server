

// const axios = require('axios');


// const OMBD_API_KEY = '8d58c823';

// const getLatestMovies = async (req, res) => {
//     try {
//         // Use Axios to fetch details for each IMDb ID directly from req.body
//         const movieDetailsPromises = req.body.imdbIds.map((imdbId) => {
//             return axios.get(`https://www.omdbapi.com/?apikey=${OMBD_API_KEY}&i=${imdbId}`);
//         });

//         const movieDetailsResponses = await Promise.all(movieDetailsPromises);
//         const movieDetails = movieDetailsResponses.map((response) => response.data);

//         res.json(movieDetails);
//     } catch (error) {
//         console.error('Error fetching movie details:', error);
//         res.status(500).send('Internal Server Error');
//     }
// };
const axios = require('axios');

const OMBD_API_KEY = '8d58c823';

const { imdbImage } = require('./controllers/imdbImage'); // Import the imdbImage function

const getLatestMovies = async (req, res) => {
    try {
        const imdbIds = req.body.imdbIds;

        // Use Axios to fetch details for each IMDb ID directly from req.body
        const movieDetailsPromises = imdbIds.map(async (imdbId) => {
            try {
                const response = await axios.get(`https://www.omdbapi.com/?apikey=${OMBD_API_KEY}&i=${imdbId}`);
                const movieDetail = response.data;

                // Pass the IMDb ID and title to the imdbImage function to retrieve the image
                const imageResponse = await imdbImage({ body: { imdbId: imdbId, title: movieDetail.Title } });
                movieDetail.Poster = imageResponse.imageUrl; // Assign the retrieved image URL to Poster

                return movieDetail;
            } catch (error) {
                console.error('Error fetching movie detail for IMDb ID:', imdbId, error);
                return null;
            }
        });

        const movieDetails = await Promise.all(movieDetailsPromises);
        res.json(movieDetails.filter(movie => movie !== null)); // Filter out null entries
    } catch (error) {
        console.error('Error fetching movie details:', error);
        res.status(500).send('Internal Server Error');
    }
};

module.exports = { getLatestMovies };



// module.exports = { getLatestMovies } ;
