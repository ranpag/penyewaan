import Joi from "joi";
import _ from "lodash";
import xss from "xss";
import errorAPI from "@utils/errorAPI";
const validate = async (schema, data) => {
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
    }
    catch (error) {
        if (error instanceof Joi.ValidationError) {
            const errorMessages = error.details.reduce((acc, err) => {
                const key = err.context?.key;
                if (key !== undefined) {
                    acc[key] = acc[key] || [];
                    acc[key].push(err.message);
                }
                return acc;
            }, {});
            return { error: errorMessages, value: null };
        }
        return { error, value: null };
    }
};
export const sanitizeAndValidate = (schema) => async (req, res, next) => {
    try {
        const sanitizedData = JSON.parse(JSON.stringify({ body: req.body, params: req.params, query: req.query }, (key, value) => (typeof value === "string" ? xss(value) : value)));
        const { error, value } = await validate(schema, sanitizedData);
        if (error) {
            return next(new errorAPI("Validation error", 400, error));
        }
        req.body = value.body || req.body;
        req.params = value.params || req.params;
        req.query = value.query || req.query;
        return next();
    }
    catch (error) {
        return next(error);
    }
};
export default sanitizeAndValidate;
