// routes/app.js

const express = require("express");
const authController = require("../controllers/authController");
const dashboardController = require("../controllers/dashboardController");
const authenticateToken = require("../middleware/authenticateToken");
const exampleController = require("../controllers/exampleController");
const imdbImageController = require("../controllers/imdbImage")
const movieList = require("../controllers/getLatestmovies");
const { proxyApi, proxyAddMovies, proxyTvApi, proxyTvAdd } = require("../controllers/ProxyApi");
const updateUserProfile = require("../controllers/updateuser");
const jwtUtils = require("../utils/jwtUtils");
const User = require("../models/User");
const { default: axios } = require("axios");
const router = express.Router();






// Auth Routes
router.post("/signup", authController.signup);
router.post("/login", authController.login);

// Protected Route
router.get("/dashboard", authenticateToken, dashboardController.dashboard);
router.get("/getUsers", exampleController.getAllUsers);
router.post("/getLatestMovies", movieList.getLatestMovies)
router.post("/getAddedMovies", movieList.getAddedMovies)
router.post("/getAddedTVShows", movieList.getAddedTvshows)
router.put('/profile/:userId', async (req, res) => {
    const userId = req.params.userId;
    const userData = req.body;

    try {
        // Ensure that the authenticated user is the same as the user being updated
        // if (req.user.id !== userId) {
        //     return res.status(403).json({ message: 'Unauthorized: You are not allowed to update this user profile' });
        // }

        // Update user profile
        const updatedUser = await updateUserProfile(userId, userData);

        if (!updatedUser) {
            return res.status(404).json({ message: 'User not found' });
        }
        const token = jwtUtils.generateToken({
            _id: updatedUser._id,
            username: updatedUser.username,
            email: updatedUser.email,
            role: updatedUser.role,
            profilePicture: updatedUser.profilePicture,

        });
        // Omit the password field from the response
        const { password: _, ...userWithoutPassword } = updatedUser.toObject();

        res.status(200).json({ message: 'User profile updated successfully', user: userWithoutPassword, token });
    } catch (error) {
        console.error('Error updating user profile:', error);
        res.status(500).json({ message: error.message || 'Internal server error' });
    }
});

router.delete("/deleteUser/:userId", async (req, res) => {
    const userId = req.params.userId;
    const userData = req.body;

    try {
        // Ensure that the authenticated user is the same as the user being updated
        // if (req.user.id !== userId) {
        //     return res.status(403).json({ message: 'Unauthorized: You are not allowed to update this user profile' });
        // }
        await User.findByIdAndDelete(userId);
        res.status(200).json({ message: 'User account has been deleted successfully.....' });
    } catch (error) {
        console.error('Error deleting user profile:', error);
        res.status(500).json({ message: error.message || 'Internal server error' });
    }


})



router.get("/", (req, res) => {
    [
        res.json("App is working good to goo buddy ")
    ]
})


router.post("/imdb-image", imdbImageController.imdbImage);
router.post("/googleSignin", authController.google)

// router.get('/api/vapi/movie/new/:page', proxyApi, apiProxy);
// router.get('/api/vapi/movie/add/:page', proxyAddMovies, apiProxy);
// router.get('/api/vapi/tv/new/:page', proxyTvApi, apiProxy);
// router.get('/api/vapi/tv/add/:page', proxyTvAdd, apiProxy);

const backendApiUrl = "https://vidsrc.xyz";
const ApiSync = async (req, res) => {
    try {
        const { page } = req.params;
        const response = await axios.get(`${backendApiUrl}/tvshows/latest/page-${page}.json`, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });
        res.json(response.data);
    } catch (error) {
        console.error({ error });
        res.status(500).json({ error: 'proxyTv server error', error });
    }
}
router.get('/api/vapi/movie/new/:page', proxyApi);
router.get('/api/vapi/tv/new/:page', proxyTvApi);
router.get('/api/vapi/tv/add/:page', proxyTvAdd);
router.get('/api/vapi/tv/ee/:page', ApiSync)

module.exports = router;
