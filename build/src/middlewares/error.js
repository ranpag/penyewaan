import errorAPI from "../utils/errorAPI.js";
import { logger } from "../utils/logger.js";
// Handle not provided path request
export const notFound = (_req, _res, next) => {
    return next(new errorAPI("Resources not found", 404));
};
// Error handler middleware
// Handle function middleware, sanitizeAndValidate, control
export const handler = (err, _req, res, _next) => {
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
