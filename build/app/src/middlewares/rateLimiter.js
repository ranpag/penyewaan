import rateLimit from "express-rate-limit";
import errorAPI from "@utils/errorAPI";
// Limit the request between IP
const rateLimiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    max: 30,
    handler: (req, res, next) => {
        next(new errorAPI("Too many requests, please try again later.", 429));
    }
});
export default rateLimiter;
