// models/OmdbCache.js - persistent cache of OMDb details (with resolved poster), survives serverless cold starts.
const mongoose = require("mongoose");

const omdbCacheSchema = new mongoose.Schema(
    {
        imdbId: { type: String, required: true, unique: true },
        data: { type: mongoose.Schema.Types.Mixed, required: true },
        expiresAt: { type: Date, required: true },
    },
    { versionKey: false }
);
// MongoDB removes the document once expiresAt has passed.
omdbCacheSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.models.OmdbCache || mongoose.model("OmdbCache", omdbCacheSchema);
