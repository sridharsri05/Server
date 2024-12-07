require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI;
const JWT_SECRET = process.env.JWT_SECRET;
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASSWORD = process.env.EMAIL_PASSWORD;
const FRONT_END_URL = process.env.FRONT_END_URL;
const SCRAPER_API_KEY = process.env.SCRAPER_API_KEY;

module.exports = { MONGODB_URI, JWT_SECRET, EMAIL_USER, EMAIL_PASSWORD, FRONT_END_URL, SCRAPER_API_KEY };