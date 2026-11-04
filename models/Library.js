// models/Library.js - per-user watchlist, liked titles and watch history
const mongoose = require("mongoose");

const listItem = new mongoose.Schema(
    {
        imdbId: { type: String, required: true },
        type: { type: String, enum: ["movie", "tv"], required: true },
        title: { type: String, default: "" },
        poster: { type: String, default: "" },
        year: { type: String, default: "" },
        addedAt: { type: Date, default: Date.now },
    },
    { _id: false }
);

const historyItem = new mongoose.Schema(
    {
        imdbId: { type: String, required: true },
        type: { type: String, enum: ["movie", "tv"], required: true },
        title: { type: String, default: "" },
        poster: { type: String, default: "" },
        year: { type: String, default: "" },
        season: { type: Number },
        episode: { type: Number },
        watchedAt: { type: Date, default: Date.now },
    },
    { _id: false }
);

const librarySchema = new mongoose.Schema(
    {
        user: { type: String, required: true, unique: true, index: true },
        watchlist: { type: [listItem], default: [] },
        liked: { type: [listItem], default: [] },
        history: { type: [historyItem], default: [] },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Library", librarySchema);
