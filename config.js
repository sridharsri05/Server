require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI;
const JWT_SECRET = process.env.JWT_SECRET;
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASSWORD = process.env.EMAIL_PASSWORD;
const VERCEL_URL = process.env.VERCEL_URL || "http://localhost:3001";
const FRONT_END_URL = process.env.FRONT_END_URL;

module.exports = { MONGODB_URI, JWT_SECRET, EMAIL_USER, EMAIL_PASSWORD, VERCEL_URL, FRONT_END_URL };