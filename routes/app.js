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
const Library = require("../models/Library");
const { default: axios } = require("axios");
const router = express.Router();
router.use("/", require("./mediaProxy")); // TMDB/OMDb proxy (/tmdb/*, /omdb)

const config = require('../config')
const requireAdmin = require("../middleware/requireAdmin");
const { isObjectId, badRequest } = require("../utils/validate");
const { authLimiter, omdbLimiter } = require("../middleware/rateLimiters");


// Auth Routes
router.post("/signup", authLimiter, authController.signup);
router.post("/login", authLimiter, authController.login);

// Protected Route
router.get("/dashboard", authenticateToken, dashboardController.dashboard);
// Library (watchlist / liked / history). History routes must come before /library/:list.
const library = require("../controllers/libraryController");
router.get("/library", authenticateToken, library.getLibrary);
router.post("/library/history", authenticateToken, library.upsertHistory);
router.delete("/library/history", authenticateToken, library.clearHistory);
router.delete("/library/history/:imdbId", authenticateToken, library.removeHistoryItem);
router.post("/library/:list", authenticateToken, library.addToList);
router.delete("/library/:list/:imdbId", authenticateToken, library.removeFromList);

// Admin only: lists every user (no frontend caller uses this).
router.get("/getUsers", authenticateToken, requireAdmin, exampleController.getAllUsers);
router.post("/getLatestMovies", omdbLimiter, movieList.getLatestMovies)
router.post("/getAddedMovies", omdbLimiter, movieList.getAddedMovies)
router.post("/getAddedTVShows", omdbLimiter, movieList.getAddedTvshows)
// Only the account owner (or an admin) may change or delete an account.
const requireSelfOrAdmin = (req, res, next) => {
    const me = req.user?.userId;
    if (me && (String(me._id) === String(req.params.userId) || me.role === 'admin')) return next();
    return res.status(403).json({ success: false, message: 'You can only change your own account.' });
};

router.put('/profile/:userId', authenticateToken, requireSelfOrAdmin, async (req, res) => {
    const userId = req.params.userId;
    const userData = req.body;
    if (!isObjectId(userId)) return badRequest(res, 'Invalid user id');
    if (!userData || typeof userData !== 'object' || Array.isArray(userData)) return badRequest(res, 'Request body is required');
    for (const key of ['username', 'email', 'password', 'profilePicture']) {
        if (userData[key] !== undefined && typeof userData[key] !== 'string') {
            return badRequest(res, `${key} must be a string`);
        }
    }

    try {
        // Update user profile (authenticateToken + requireSelfOrAdmin ran above)
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

router.delete("/deleteUser/:userId", authenticateToken, requireSelfOrAdmin, async (req, res) => {
    const userId = req.params.userId;
    if (!isObjectId(userId)) return badRequest(res, 'Invalid user id');

    try {
        const deleted = await User.findByIdAndDelete(userId);
        if (!deleted) return res.status(404).json({ message: 'User not found' });
        await Library.deleteOne({ user: userId });
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
router.post("/googleSignin", authLimiter, authController.google)
router.post("/forgot-password", authLimiter, authController.forgotPassword)
router.post("/reset-password/:token", authLimiter, authController.resetPassword)

// -----> Proxy Routes for VAPI <-----
router.get('/api/vapi/movie/new/:page', proxyApi);
router.get('/api/vapi/tv/add/:page', proxyTvAdd);


// note this route not working
router.get('/api/vapi/tv/new/:page', proxyTvApi);

module.exports = router;
