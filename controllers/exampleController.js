const User = require("../models/User");

const getAllUsers = async (req, res) => {
    try {
        const users = await User.find({}, "-password"); // Exclude password field from the response
        res.json(users);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

module.exports = { getAllUsers };
