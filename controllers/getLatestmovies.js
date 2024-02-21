// const { default: axios } = require("axios");


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

// module.exports = { getLatestMovies };

const axios = require("axios");
const { imdbImage } = require("./imdbImage"); // Import imdbImage function

// const OMBD_API_KEY = "8d58c823";
const OMBD_API_KEY = "78532d38";

const getLatestMovies = async (req, res) => {
    try {
        // Use Axios to fetch details for each IMDb ID directly from req.body
        const movieDetailsPromises = req.body.imdbIds.map(async (imdbId) => {
            const response = await axios.get(
                `https://www.omdbapi.com/?apikey=${OMBD_API_KEY}&i=${imdbId}`
            );
            let movieDetails = response.data;

            // Check if the poster is "N/A"
            if (movieDetails.Poster === "N/A") {
                // Call imdbImage function to fetch image URL from IMDb
                const imdbImageResponse = await imdbImage(imdbId); // Pass imdbId directly
                movieDetails.Poster = imdbImageResponse.imageUrl;
            }

            return movieDetails;
        });

        const movieDetails = await Promise.all(movieDetailsPromises);

        res.json(movieDetails).status(200);
        console.log(movieDetails, "Movie");
    } catch (error) {
        console.error("Error fetching movie details:", error);
        res.status(500).send("Internal Server Error");
    }
};
const getAddedMovies = async (req, res) => {
    try {
        // Use Axios to fetch details for each IMDb ID directly from req.body
        const movieDetailsPromises = req.body.imdbIds.map(async (imdbId) => {
            const response = await axios.get(
                `https://www.omdbapi.com/?apikey=${OMBD_API_KEY}&i=${imdbId}`
            );
            let movieDetails = response.data;

            // Check if the poster is "N/A"
            if (movieDetails.Poster === "N/A") {
                // Call imdbImage function to fetch image URL from IMDb
                const imdbImageResponse = await imdbImage(imdbId); // Pass imdbId directly
                movieDetails.Poster = imdbImageResponse.imageUrl;
            }

            return movieDetails;
        });

        const movieDetails = await Promise.all(movieDetailsPromises);

        res.json(movieDetails).status(200);
        console.log(movieDetails, "Movie");
    } catch (error) {
        console.error("Error fetching movie details:", error);
        res.status(500).send("Internal Server Error");
    }
};
const getAddedTvshows = async (req, res) => {
    try {
        // Use Axios to fetch details for each IMDb ID directly from req.body
        const movieDetailsPromises = req.body.imdbIds.map(async (imdbId) => {
            const response = await axios.get(
                `https://www.omdbapi.com/?apikey=${OMBD_API_KEY}&i=${imdbId}`
            );
            let movieDetails = response.data;

            // Check if the poster is "N/A"
            if (movieDetails.Poster === "N/A") {
                // Call imdbImage function to fetch image URL from IMDb
                const imdbImageResponse = await imdbImage(imdbId); // Pass imdbId directly
                movieDetails.Poster = imdbImageResponse.imageUrl;
            }

            return movieDetails;
        });

        const movieDetails = await Promise.all(movieDetailsPromises);

        res.json(movieDetails).status(200);
        console.log(movieDetails, "Movie");
    } catch (error) {
        console.error("Error fetching movie details:", error);
        res.status(500).send("Internal Server Error");
    }
};

module.exports = { getLatestMovies, getAddedMovies ,getAddedTvshows};
