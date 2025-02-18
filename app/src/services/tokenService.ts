import jwt, { JwtPayload } from "jsonwebtoken";
import env from "~/configs/env";
import errorAPI from "@utils/errorAPI";
import cache from "./cacheService";

const generateAccessToken = (userData: Record<string, string | number>) => {
    const expiresIn = env.ACCESS_TOKEN_EXPIRATION_MINUTES * 60 * 3;
    return jwt.sign(userData, env.JWT_TOKEN_SECRET_PRIVATE, {
        algorithm: "RS256",
        expiresIn
    });
};

const verifyAccessToken = async (accessToken: string) => {
    try {
        const blacklist = await cache.get(`blacklist:${accessToken}`);
        if (blacklist) {
            throw new errorAPI("Forbidden", 403, ["Kamu tidak bisa mengakses ini"]);
        }

        return jwt.verify(accessToken, env.JWT_TOKEN_SECRET_PUBLIC, {
            algorithms: ["RS256"]
        });
    } catch (err) {
        if (err instanceof Error) {
            if (err.name === "TokenExpiredError") {
                throw new errorAPI("Unauthorized", 401, ["Access expired"]);
            } else if (err.name === "JsonWebTokenError") {
                throw new errorAPI("Unauthorized", 401, ["Access is invalid"]);
            }
            throw err;
        }

        throw err;
    }
};

const generateRefreshToken = (userData: Record<string, string | number>) => {
    const expiresIn = 60 * 60 * 24 * env.REFRESH_TOKEN_EXPIRATION_DAYS;
    return jwt.sign(userData, env.JWT_TOKEN_SECRET_PRIVATE, {
        algorithm: "RS256",
        expiresIn
    });
};

const verifyRefreshToken = async (refreshToken: string) => {
    try {
        const blacklist = await cache.get(`blacklist:${refreshToken}`);
        if (blacklist) {
            throw new errorAPI("Forbidden", 403, ["Kamu tidak bisa mengakses ini"]);
        }

        return jwt.verify(refreshToken, env.JWT_TOKEN_SECRET_PUBLIC, {
            algorithms: ["RS256"]
        });
    } catch (err) {
        if (err instanceof Error) {
            if (err.name === "TokenExpiredError") {
                throw new errorAPI("Unauthorized", 401, ["Refresh token expired"]);
            } else if (err.name === "JsonWebTokenError") {
                throw new errorAPI("Unauthorized", 401, ["Refresh token is invalid"]);
            }
            throw err;
        }

        throw err;
    }
};

const generateResetPasswordToken = (userData: Record<string, string | number>) => {
    const expiresIn = 60 * 30;
    return jwt.sign(userData, env.JWT_TOKEN_SECRET_PRIVATE, {
        algorithm: "RS256",
        expiresIn
    });
};

const verifyResetPasswordToken = async (resetPasswordToken: string) => {
    try {
        return jwt.verify(resetPasswordToken, env.JWT_TOKEN_SECRET_PUBLIC, {
            algorithms: ["RS256"]
        });
    } catch (err) {
        if (err instanceof Error) {
            if (err.name === "TokenExpiredError") {
                throw new errorAPI("Forbidden", 403, ["Token expired"]);
            } else if (err.name === "JsonWebTokenError") {
                throw new errorAPI("Forbidden", 403, ["Token invalid"]);
            }
            throw err;
        }

        throw err;
    }
};

const blacklistToken = async (accessToken?: string, refreshToken?: string) => {
    console.log(accessToken, refreshToken);
    try {
        if (accessToken) {
            const decodedAccessToken = jwt.decode(accessToken);
            const exp = (decodedAccessToken as JwtPayload).exp;
            const ttl = exp! - Math.floor(Date.now() / 1000);

            if (ttl > 0) {
                await cache.set(`blacklist:${accessToken}`, "true", ttl);
                console.log(`Access Token diblacklist selama ${ttl} detik`);
            }
        }

        if (refreshToken) {
            const decodeRefreshToken = jwt.decode(refreshToken);
            const exp = (decodeRefreshToken as JwtPayload).exp;
            const ttl = exp! - Math.floor(Date.now() / 1000);

            if (ttl > 0) {
                await cache.set(`blacklist:${refreshToken}`, "true", ttl);
                console.log(`Refresh Token diblacklist selama ${ttl} detik`);
            }
        }
    } catch (err) {
        throw err;
    }
};

export default {
    generateAccessToken,
    verifyAccessToken,
    generateRefreshToken,
    verifyRefreshToken,
    blacklistToken,
    generateResetPasswordToken,
    verifyResetPasswordToken
};
