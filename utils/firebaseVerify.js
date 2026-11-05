// utils/firebaseVerify.js - verifies Firebase ID tokens against Google's public keys (no service account needed).
const { createRemoteJWKSet, jwtVerify } = require("jose");
const config = require("../config");

const JWKS = createRemoteJWKSet(
    new URL("https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com")
);

// Resolves with the verified token payload; throws if signature, issuer, audience or expiry is wrong.
const verifyFirebaseIdToken = async (idToken) => {
    const { payload } = await jwtVerify(idToken, JWKS, {
        issuer: `https://securetoken.google.com/${config.FIREBASE_PROJECT_ID}`,
        audience: config.FIREBASE_PROJECT_ID,
        algorithms: ["RS256"],
    });
    if (!payload.sub) throw new Error("Token has no subject");
    return payload;
};

module.exports = { verifyFirebaseIdToken };
