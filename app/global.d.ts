/* eslint-disable no-unused-vars */
// src/express.d.ts
import { Request } from "express";
import { JwtPayload } from "jsonwebtoken";

declare global {
    namespace Express {
        interface Request {
            user?: string | JwtPayload;
        }
    }
}
