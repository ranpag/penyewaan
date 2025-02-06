import { NextFunction, Request, Response } from "express";

export const control = (func: Function) => (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(func(req, res)).catch((err) => next(err));
};

export default control;
