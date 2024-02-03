// utils/jwtUtils.js

var jwt = require("jsonwebtoken");
var config = require("../config");

var generateToken = function (userId, role) {
    return jwt.sign({ userId: userId, role: role }, config.JWT_SECRET, {
        expiresIn: "1h",
    });
};

var verifyToken = function (token) {
    try {
        const decoded = jwt.verify(token, config.JWT_SECRET);
        return decoded;
    } catch (error) {
        // Token is invalid or expired
        throw new Error('Invalid or expired token');
    }
};

module.exports = {
    generateToken: generateToken,
    verifyToken: verifyToken,
};
