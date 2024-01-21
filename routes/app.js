// routes/app.js

const express = require("express");
const authController = require("../controllers/authController");
const dashboardController = require("../controllers/dashboardController");
const authenticateToken = require("../middleware/authenticateToken");
const exampleController = require("../controllers/exampleController");
const imdbImageController = require("../controllers/imdbImage")
const router = express.Router();

// Auth Routes
router.post("/signup", authController.signup);
router.post("/login", authController.login);

// Protected Route
router.get("/dashboard", authenticateToken, dashboardController.dashboard);
router.get("/getUsers", exampleController.getAllUsers);
router.get("/", (req, res) => {
    [
        res.json("App is working good to goo buddy ")
    ]
})
router.post("/imdb-image", imdbImageController.imdbImage)
module.exports = router;
