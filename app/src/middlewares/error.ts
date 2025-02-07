import errorAPI from "@utils/errorAPI";
import { logger } from "@utils/logger";
import { NextFunction, Request, Response } from "express";

// Handle not provided path request
export const notFound = (_req: Request, _res: Response, next: NextFunction) => {
    return next(new errorAPI("Resources not found", 404));
};

// Error handler middleware
// Handle function middleware, sanitizeAndValidate, control
export const handler = (err: Error | errorAPI, _req: Request, res: Response, _next: NextFunction) => {
    logger.error(err.stack);

    if (err instanceof errorAPI) {
        res.status(err.status).json({
            success: false,
            message: err.message,
            errors: err.errors
        });

        return;
    }

    res.status(500).json({
        success: false,
        message: "Internal Server Error"
    });
};

export default { notFound, handler };
