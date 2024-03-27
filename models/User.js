// models/User.js
var mongoose = require('mongoose');

var userSchema = new mongoose.Schema({
    username: String,
    email: String,
    password: String,
    role: String,
     profilePicture: {
        type: String,
        default: "https://imgs.search.brave.com/Untz9IPAq0oiUcfN8fk7HLba5S-y5zmEOXfDG5xp1zk/rs:fit:500:0:0/g:ce/aHR0cHM6Ly9pbWFn/ZXMudW5zcGxhc2gu/Y29tL3Bob3RvLTE0/NDQ3MDM2ODY5ODEt/YTNhYmJjNGQ0ZmUz/P3E9ODAmdz0xMDAw/JmF1dG89Zm9ybWF0/JmZpdD1jcm9wJml4/bGliPXJiLTQuMC4z/Jml4aWQ9TTN3eE1q/QTNmREI4TUh4elpX/RnlZMmg4T0h4OGNH/bGpkSFZ5Wlh4bGJu/d3dmSHd3Zkh4OE1B/PT0.jpeg",
    },
}, { timestamps: true });

var User = mongoose.model('User', userSchema);

module.exports = User;
