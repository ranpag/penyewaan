import bcrypt from "bcrypt";
import { logger } from "@utils/logger";
import tokenService from "@services/tokenService";
import errorAPI from "@utils/errorAPI";
import { Request, Response } from "express";
import prisma from "~/src/database/prisma";
import env from "~/configs/env";
import { Prisma } from "@prisma/client";

const signup = async (req: Request, res: Response) => {
    try {
        const hashedPassword = await bcrypt.hash(req.body.admin_password, env.COST_FACTOR);

        const admin = await prisma.admin.create({
            data: {
                admin_username: req.body.admin_username,
                admin_password: hashedPassword
            },
            omit: {
                admin_password: true
            }
        });

        logger.info(`${admin.admin_username} has been registered to the system`);

        return res.status(201).json({
            success: true,
            statusCode: 201,
            message: "Signup succesfull",
            data: admin
        });
    } catch (err) {
        logger.error("Error during signup:" + err);
        throw err;
    }
};

const signin = async (req: Request, res: Response) => {
    try {
        const admin = await prisma.admin.findUnique({
            where: {
                admin_username: req.body.admin_username
            }
        });

        if (!admin) throw new errorAPI("Unauthorized", 401, ["Invalid credentials"]);

        const isPasswordValid = await bcrypt.compare(req.body.admin_password, admin.admin_password);
        if (!isPasswordValid) throw new errorAPI("Unauthorized", 401, ["Invalid credentials"]);

        const adminData = {
            admin_id: admin.admin_id,
            admin_username: admin.admin_username
        };

        const accessToken = tokenService.generateAccessToken(adminData);
        const refreshToken = tokenService.generateRefreshToken(adminData);

        logger.info(`${admin.admin_username} has been signin`);

        return res.status(200).json({
            success: true,
            statusCode: 200,
            message: "Signin successfull",
            data: {
                adminData,
                token: {
                    access_token: accessToken,
                    refresh_token: refreshToken
                }
            }
        });
    } catch (err) {
        logger.error("Error during signin:" + err);
        throw err;
    }
};

const signout = async (req: Request, res: Response) => {
    try {
        const refreshToken = (req.headers["X-Refresh-Token"] || req.headers["x-refresh-token"]) as string;
        const bearerToken = req.headers["authorization"] || (req.headers["Authorization"] as string);
        const accessToken = bearerToken.split(" ")[1];

        if (!refreshToken || !accessToken) {
            throw new errorAPI("Unauthorized", 401, ["Access Token and Refresh Token required"]);
        }

        await tokenService.blacklistToken(accessToken, refreshToken);

        return res.status(204).send();
    } catch (err) {
        logger.error("Error during signout:" + err);
        throw err;
    }
};

const refresh = async (req: Request, res: Response) => {
    try {
        const refreshToken = (req.headers["X-Refresh-Token"] || req.headers["x-refresh-token"]) as string;
        const bearerToken = req.headers["authorization"] || (req.headers["Authorization"] as string);
        const accessToken = bearerToken.split(" ")[1];

        if (!refreshToken || !accessToken) {
            throw new errorAPI("Unauthorized", 401, ["Access Token and Refresh Token required"]);
        }
        const payloadRefreshToken = (await tokenService.verifyRefreshToken(refreshToken)) as Record<string, string | number>;

        const { exp, iat, ...cleanPayload } = payloadRefreshToken;

        const newAccessToken = tokenService.generateAccessToken(cleanPayload);
        await tokenService.blacklistToken(accessToken);

        return res.status(200).json({
            success: true,
            statusCode: 200,
            message: "Access extended",
            data: {
                token: {
                    access_token: newAccessToken
                }
            }
        });
    } catch (err) {
        logger.error("Error during refresh:" + err);
        throw err;
    }
};

const changePassword = async (req: Request, res: Response) => {
    try {
        const adminChangePassword = await prisma.admin.update({
            where: { admin_id: Number(req.user?.admin_id) },
            data: { admin_password: req.body.new_password },
            omit: { admin_password: true }
        });

        return res.status(200).json({
            success: true,
            statusCode: 200,
            message: "Password berhasil di ganti",
            data: adminChangePassword
        });
    } catch (err) {
        logger.error("Error during change:" + err);
        throw err;
    }
};

const resetPassword = async (req: Request, res: Response) => {
    try {
        const hashedPassword = await bcrypt.hash(req.body.new_password, env.COST_FACTOR);
        const admin = await prisma.admin.update({
            where: {
                admin_username: req.body.admin_username
            },
            data: {
                admin_password: hashedPassword
            },
            omit: { admin_password: true }
        });

        logger.info(`${admin.admin_username} has been resetting password`);

        return res.status(200).json({
            success: true,
            statusCode: 200,
            message: "Reset password successfull",
            data: admin
        });
    } catch (err) {
        logger.error("Error during signin:" + err);

        if (err instanceof Prisma.PrismaClientKnownRequestError) {
            if (err.code === "P2025") {
                throw new errorAPI("Admin tidak ditemukan", 404);
            }
        }

        throw err;
    }
};

export default { signup, signin, signout, refresh, changePassword, resetPassword };
