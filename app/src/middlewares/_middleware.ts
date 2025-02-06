import guest from "@middlewares/guest";
import auth from "@middlewares/auth";
import { NextFunction, Request, Response } from "express";

// Definisikan tipe untuk middleware
type MiddlewareList = {
    guest: (_req: Request, _res: Response, _next: NextFunction) => void;
    auth: (_req: Request, _res: Response, _next: NextFunction) => void;
};

const listMiddleware: MiddlewareList = {
    guest,
    auth
};

export const middleware = (middlewares: string | string[]) => async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!Array.isArray(middlewares)) {
            middlewares = [middlewares];
        }

        for (const mw of middlewares) {
            if (listMiddleware[mw as keyof MiddlewareList]) {
                await new Promise<void>((resolve, reject) => {
                    listMiddleware[mw as keyof MiddlewareList](req, res, (err: unknown) => {
                        if (err) return reject(err);
                        resolve();
                    });
                });
            } else {
                throw new Error(`Middleware ${mw} tidak ditemukan.`);
            }
        }

        next();
    } catch (err) {
        return next(err);
    }
};

export default middleware;
