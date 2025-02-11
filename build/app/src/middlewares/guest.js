import errorAPI from "@utils/errorAPI";
// Check the request must not have Authorization token and Refresh token in cookie or headers
const guest = (req, _res, next) => {
    if (req.headers["authorization"] || req.headers["X-Refresh-Token"] || req.headers["x-refresh-token"]) {
        throw new errorAPI("Only guest user can access this", 400);
    }
    next();
};
export default guest;
