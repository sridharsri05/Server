// controllers/authControllers.js

const bcrypt = require("bcrypt");
const User = require("../models/User.js");
const jwtUtils = require("../utils/jwtUtils.js");
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const config = require("../config")
const { isEmail, isNonEmptyString, isString, badRequest } = require("../utils/validate.js");
const { verifyFirebaseIdToken } = require("../utils/firebaseVerify.js");

const login = async function (req, res) {
    try {
        const { email, password } = req.body || {};
        if (!isEmail(email) || !isNonEmptyString(password, 200)) {
            return badRequest(res, 'A valid email and password (strings) are required');
        }
        const user = await User.findOne({ email: email.toLowerCase() });

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
            profilePicture: user.profilePicture,
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
                profilePicture: user.profilePicture,
            },
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: 'error', message: 'Internal Server Error' });
    }
};
const google = async (req, res) => {
    try {
        // Identity comes ONLY from a verified Firebase ID token, never from the request body.
        const { idToken } = req.body || {};
        if (idToken === undefined || idToken === null || idToken === "") {
            return badRequest(res, 'idToken is required');
        }
        if (!isNonEmptyString(idToken, 8192)) {
            return badRequest(res, 'idToken must be a string');
        }

        let claims;
        try {
            claims = await verifyFirebaseIdToken(idToken);
        } catch (verifyError) {
            return res.status(401).json({ status: 'error', message: 'Invalid or expired Google sign-in token' });
        }
        if (!isEmail(claims.email) || claims.email_verified !== true) {
            return res.status(401).json({ status: 'error', message: 'Google account email is not verified' });
        }

        const email = claims.email.toLowerCase();
        const name = isString(claims.name) && claims.name.trim() ? claims.name : email.split("@")[0];
        const photo = isString(claims.picture) ? claims.picture : undefined;

        const user = await User.findOne({ email });
        if (user) {
            const token = jwtUtils.generateToken({
                _id: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
                profilePicture: user.profilePicture,
            });
            const { password: hashedPassword, ...rest } = user._doc;
            res.status(200).json({
                status: "success",
                message: "User found",
                token,
                user: rest,
            });
        } else {
            const generatePassword = crypto.randomBytes(24).toString('hex');
            const hashedPassword = await bcrypt.hash(generatePassword, 10);

            const newUser = new User({
                username: name.split(" ").join("").toLowerCase(),
                email,
                password: hashedPassword,
                profilePicture: photo,
                role: 'user',
            });
            await newUser.save();

            const token = jwtUtils.generateToken({
                _id: newUser._id,
                username: newUser.username,
                email: newUser.email,
                role: newUser.role,
                profilePicture: newUser.profilePicture,
            });
            const { password: hashedPassword2, ...rest } = newUser._doc;
            res.status(200).json({
                status: "success",
                message: "User successfully created",
                token,
                user: rest,
            });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: 'error', message: 'Internal Server Error' });
    }
}

const signup = async function (req, res) {
    try {
        const { username, email, password } = req.body || {};
        if (!isNonEmptyString(username, 100) || !isEmail(email) || !isNonEmptyString(password, 200)) {
            return badRequest(res, 'username, a valid email and password (strings) are required');
        }
        const normEmail = email.toLowerCase();

        // Check if the email is already registered
        const existingUser = await User.findOne({ email: normEmail });
        if (existingUser) {
            return res.status(400).json({ status: 'error', message: 'Email already registered' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({
            username,
            email: normEmail,
            password: hashedPassword,
            role: 'user', // never trust a client-supplied role (privilege escalation)
        });

        await newUser.save();

        res.status(201).json({ status: 'success', message: 'User created successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: 'error', message: 'Backend Server Error' });
    }
};



const forgotPassword = async (req, res) => {
    const { email } = req.body || {};
    if (!isEmail(email)) {
        return badRequest(res, 'A valid email (string) is required');
    }

    try {
        // Check if user exists
        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Generate reset token
        const token = crypto.randomBytes(32).toString('hex');
        user.resetToken = token;
        user.resetTokenExpiration = Date.now() + 3600000; // Token valid for 1 hour
        await user.save();

        // Create transport for sending emails
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: config.EMAIL_USER,
                pass: config.EMAIL_PASSWORD, // Use app-specific password if required
            },
        });

        // Determine the base URL (use Vercel URL in production, localhost in development)


        const resetUrl = `${config.FRONT_END_URL}/reset-password/${token}`;

        // Define email options
        const mailOptions = {
            to: email,
            from: 'noreplay_movienexus@gmail.com',
            subject: 'Password Reset',
            html: `
                <p>You requested a password reset</p>
                <p>Click this <a href="${resetUrl}">link</a> to reset your password.</p>
                <p>If you did not request this, please ignore this email and your password will remain unchanged.</p>
            `,
        };

        // Send email using async/await and error handling
        try {
            await transporter.sendMail(mailOptions);
            res.status(200).json({ message: 'Reset link sent to your email' });
        } catch (emailError) {
            console.error('Error sending email:', emailError);
            return res.status(500).json({
                message: 'Failed to send reset email. Please try again later.',
                error: emailError.message, // Provide detailed error message for debugging
            });
        }

    } catch (error) {
        // Log the error for server-side debugging
        console.error('Server error during password reset process:', error);
        res.status(500).json({
            message: 'Server error occurred. Please try again later.',
            error: error.message, // Include the error message for debugging purposes
        });
    }
};
 


const resetPassword = async (req, res) => {
    const { token } = req.params;
    const { password } = req.body || {};
    if (!isNonEmptyString(token, 200) || !isNonEmptyString(password, 200)) {
        return badRequest(res, 'A valid token and password (strings) are required');
    }

    try {
        // Validate the token and check if it's expired
        const user = await User.findOne({
            resetToken: token,
            resetTokenExpiration: { $gt: Date.now() }, // Ensure token is not expired
        });

        if (!user) {
            return res.status(400).json({ message: 'Invalid or expired token' });
        }

        // Hash the new password
        let hashedPassword;
        try {
            hashedPassword = await bcrypt.hash(password, 12);
        } catch (hashError) {
            console.error('Error hashing password:', hashError);
            return res.status(500).json({ message: 'Failed to hash password. Please try again.' });
        }

        // Update the user with the new password and clear the reset token
        user.password = hashedPassword;
        user.resetToken = undefined; // Clear the token after use
        user.resetTokenExpiration = undefined; // Clear the expiration

        try {
            await user.save();
        } catch (saveError) {
            console.error('Error saving user with new password:', saveError);
            return res.status(500).json({ message: 'Failed to update user password. Please try again.' });
        }

        res.status(200).json({ message: 'Password reset successfully' });
    } catch (error) {
        console.error('Server error during password reset:', error);
        res.status(500).json({ message: 'Server error. Please try again later.' });
    }
};

module.exports = {
    login,
    signup,
    google,
    resetPassword,
    forgotPassword
};
