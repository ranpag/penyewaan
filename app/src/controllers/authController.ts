import bcrypt from "bcrypt";
import { logger } from "@utils/logger";
import tokenService from "@services/tokenService";
import errorAPI from "@utils/errorAPI";
import { Request, Response } from "express";
import prisma from "~/src/database/prisma";

const signup = async (req: Request, res: Response) => {
    try {
        const hashedPassword = await bcrypt.hash(req.body.admin_password, 15);

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

        if (!admin) throw new errorAPI("Sign in failed", 401, ["Invalid credentials"]);

        const isPasswordValid = await bcrypt.compare(req.body.admin_password, admin.admin_password);
        if (!isPasswordValid) throw new errorAPI("Sign in failed", 401, ["Invalid credentials"]);

        const adminData = {
            id: admin.admin_id,
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

const refresh = async (req: Request, res: Response) => {
    try {
        const refreshToken = (req.headers["X-Refresh-Token"] || req.headers["x-refresh-token"]) as string;
        const payloadRefreshToken = (await tokenService.verifyRefreshToken(refreshToken)) as Record<string, string | number>;

        // eslint-disable-next-line no-unused-vars
        const { exp, ...cleanPayload } = payloadRefreshToken;

        const accessToken = tokenService.generateAccessToken(cleanPayload);

        return res.status(200).json({
            success: true,
            statusCode: 200,
            message: "Access extended",
            data: {
                token: {
                    access_token: accessToken
                }
            }
        });
    } catch (err) {
        logger.error("Error during refresh:" + err);
        throw err;
    }
};

export default { signup, signin, refresh };
