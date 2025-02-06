import Joi from "joi";
import _ from "lodash";
import xss from "xss";
import errorAPI from "@utils/errorAPI";
import { NextFunction, Request, Response } from "express";

const validate = async (schema: Record<string, Joi.ObjectSchema>, data: Record<string, string | number>) => {
    const validSchema = _.pick(schema, ["params", "query", "body"]);
    try {
        const object = _.pick(data, Object.keys(validSchema));
        const value = await Joi.object(validSchema)
            .prefs({
                errors: { label: "key" },
                abortEarly: false
            })
            .validateAsync(object);

        return { error: null, value };
    } catch (error) {
        if (error instanceof Joi.ValidationError) {
            const errorMessages = error.details.map((detail: Joi.ValidationErrorItem) => detail.message);
            return { error: errorMessages, value: null };
        }
        return { error, value: null };
    }
};

export const sanitizeAndValidate = (schema: Record<string, Joi.ObjectSchema>) => async (req: Request, res: Response, next: NextFunction) => {
    try {
        const sanitizedData = JSON.parse(
            JSON.stringify({ body: req.body, params: req.params, query: req.query }, (key, value) => (typeof value === "string" ? xss(value) : value))
        );

        const { error, value } = await validate(schema, sanitizedData);

        if (error) {
            return next(new errorAPI("Validation error", 400, error));
        }

        req.body = value.body || req.body;
        req.params = value.params || req.params;
        req.query = value.query || req.query;

        return next();
    } catch (error) {
        return next(error);
    }
};

export default sanitizeAndValidate;
