import errorAPI from "@utils/errorAPI";
import { NextFunction, Request, Response } from "express";

// Check the request must not have Authorization token and Refresh token in cookie or headers
const guest = (req: Request, _res: Response, next: NextFunction) => {
    if (req.headers["authorization"] || req.headers["X-Refresh-Token"] || req.headers["x-refresh-token"]) {
        throw new errorAPI("Only guest user can access this", 400);
    }

    next();
};

export default guest;
