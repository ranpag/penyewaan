import guest from "./guest.js";
import auth from "./auth.js";
const listMiddleware = {
    guest,
    auth
};
export const middleware = (middlewares) => async (req, res, next) => {
    try {
        if (!Array.isArray(middlewares)) {
            middlewares = [middlewares];
        }
        for (const mw of middlewares) {
            if (listMiddleware[mw]) {
                await new Promise((resolve, reject) => {
                    listMiddleware[mw](req, res, (err) => {
                        if (err)
                            return reject(err);
                        resolve();
                    });
                });
            }
            else {
                throw new Error(`Middleware ${mw} tidak ditemukan.`);
            }
        }
        next();
    }
    catch (err) {
        return next(err);
    }
};
export default middleware;
