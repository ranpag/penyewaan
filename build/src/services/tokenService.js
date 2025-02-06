import jwt from "jsonwebtoken";
import env from "../../configs/env.js";
import errorAPI from "../utils/errorAPI.js";
import fs from "fs";
import path from "path";
const privateKeyPath = path.resolve(env.JWT_TOKEN_SECRET_PRIVATE_PATH);
const publicKeyPath = path.resolve(env.JWT_TOKEN_SECRET_PUBLIC_PATH);
const privateKey = fs.readFileSync(privateKeyPath, "utf8");
const publicKey = fs.readFileSync(publicKeyPath, "utf8");
const generateAccessToken = (userData) => {
    const expiresIn = env.ACCESS_TOKEN_EXPIRATION_MINUTES * 60;
    return jwt.sign(userData, privateKey, {
        algorithm: "RS256",
        expiresIn
    });
};
const verifyAccessToken = async (accessToken) => {
    try {
        return jwt.verify(accessToken, publicKey, {
            algorithms: ["RS256"]
        });
    }
    catch (err) {
        if (err instanceof Error) {
            if (err.name === "TokenExpiredError") {
                throw new errorAPI("Access expired", 401);
            }
            else if (err.name === "JsonWebTokenError") {
                throw new errorAPI("Access is invalid", 401);
            }
            throw err;
        }
        throw err;
    }
};
const generateRefreshToken = (userData) => {
    const expiresIn = 60 * 60 * 24 * env.REFRESH_TOKEN_EXPIRATION_DAYS;
    return jwt.sign(userData, privateKey, {
        algorithm: "RS256",
        expiresIn
    });
};
const verifyRefreshToken = async (refreshToken) => {
    try {
        return jwt.verify(refreshToken, publicKey, {
            algorithms: ["RS256"]
        });
    }
    catch (err) {
        if (err instanceof Error) {
            if (err.name === "TokenExpiredError") {
                throw new errorAPI("Refresh token expired", 401);
            }
            else if (err.name === "JsonWebTokenError") {
                throw new errorAPI("Refresh token is invalid", 401);
            }
            throw err;
        }
        throw err;
    }
};
export default {
    generateAccessToken,
    verifyAccessToken,
    generateRefreshToken,
    verifyRefreshToken
};
