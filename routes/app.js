// routes/app.js

const express = require("express");
const authController = require("../controllers/authController");
const dashboardController = require("../controllers/dashboardController");
const authenticateToken = require("../middleware/authenticateToken");
const exampleController = require("../controllers/exampleController");
const imdbImageController = require("../controllers/imdbImage")
const movieList = require("../controllers/getLatestmovies");
const { proxyApi, apiProxy, proxyAddmovies, proxyTvApi, proxyTvAdd } = require("../controllers/ProxyApi");
const router = express.Router();






// Auth Routes
router.post("/signup", authController.signup);
router.post("/login", authController.login);

// Protected Route
router.get("/dashboard", authenticateToken, dashboardController.dashboard);
router.get("/getUsers", exampleController.getAllUsers);
router.post("/getLatestMovies", movieList.getLatestMovies)
router.post("/getAddedMovies", movieList.getAddedMovies)
router.post("/getAddedShows", movieList.getAddedTvshows)
router.get("/", (req, res) => {
    [
        res.json("App is working good to goo buddy ")
    ]
})
router.post("/imdb-image", imdbImageController.imdbImage);
router.post("/googleSignin", authController.google)

router.get('/api/vapi/movie/new/:page', proxyApi, apiProxy);
router.get('/api/vapi/movie/add/:page', proxyAddmovies, apiProxy);
router.get('/api/vapi/tv/new/:page', proxyTvApi, apiProxy);
router.get('/api/vapi/tv/add/:page', proxyTvAdd, apiProxy);


module.exports = router;
