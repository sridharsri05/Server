// controllers/authControllers.js

const bcrypt = require("bcrypt");
const User = require("../models/User.js");
const jwtUtils = require("../utils/jwtUtils.js");

const login = async function (req, res) {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(401).json({ status: 'error', message: 'User not found' });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(401).json({ status: 'error', message: 'Invalid credentials' });
        }

        const token = jwtUtils.generateToken({
            _id: user._id,
            username: user.username,
            email: user.email,
            role: user.role,
            profilePicture:user.profilePicture,
        });

        res.json({
            status: 'success',
            message: 'Login successful',
            token,
            user: {
                _id: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
                profilePicture:user.profilePicture,
            },
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: 'error', message: 'Internal Server Error' });
    }
};
const google = async (req, res) => {
    try {
        const { email, username, photo } = req.body;
        const user = await User.findOne({ email });
        if (user) {
            // If the user exists, generate a token for the user
            const token = jwtUtils.generateToken({
            _id: user._id,
            username: user.username,
            email: user.email,
            role: user.role,
            profilePicture:user.profilePicture,
            });

            // Since the user exists, you probably want to return some user information
            // excluding the password for security reasons
            const { password: hashedPassword, ...rest } = user._doc;

            // Return the user information and the token
            res.status(200).json({
                status: "success",
                message: "User found",
                token,
                user: rest,
            });
        } else {
            // If the user doesn't exist, create a new user
            const generatePassword = Math.random().toString(36).slice(-8);
            const hashedPassword = await bcrypt.hash(generatePassword, 10); // Await the hashing operation

            // Create a new user with the provided details
            const newUser = new User({
                username: username.split(" ").join("").toLowerCase(),
                email: email,
                password: hashedPassword,
                profilePicture: photo,
                role:'user',
            });

            // Save the new user to the database
            await newUser.save();

            // Generate a token for the new user
            const token = jwtUtils.generateToken(
                { 
                    _id: newUser._id , 
                    username: newUser.username,
                    email: newUser.email,
                    role: newUser.role,
                    profilePicture:newUser.profilePicture,
                
                });

            // Return the token and the user information (excluding password)
            const { password: hashedPassword2, ...rest } = newUser._doc;
            res.status(200).json({
                status: "success",
                message: "User successfully created",
                token,
                user: rest, // Return the user information
            });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: 'error', message: error });
    }
}

const signup = async function (req, res) {
    try {
        const { username, email, password, role } = req.body;

        // Check if the email is already registered
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ status: 'error', message: 'Email already registered' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
       
        const newUser = new User({
            username,
            email,
            password: hashedPassword,
            role: role || 'user',
        });

        await newUser.save();

        res.status(201).json({ status: 'success', message: 'User created successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: 'error', message: 'Backend Server Error' });
    }
};

module.exports = {
    login,
    signup,
    google
};
