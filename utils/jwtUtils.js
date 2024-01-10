// utils/jwtUtils.js
var jwt = require("jsonwebtoken");
var config = require("../config");

var generateToken = function (userId, role) {
    return jwt.sign({ userId: userId, role: role }, config.JWT_SECRET, {
        expiresIn: "1h",
    });
};

var verifyToken = function (token) {
    return jwt.verify(token, config.JWT_SECRET);
};

module.exports = {
    generateToken: generateToken,
    verifyToken: verifyToken,
};
