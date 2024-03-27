// models/User.js
var mongoose = require('mongoose');

var userSchema = new mongoose.Schema({
    username: String,
    email: String,
    password: String,
    role: String,
    profilePicture: String,
}, { timestamps: true });

var User = mongoose.model('User', userSchema);

module.exports = User;
