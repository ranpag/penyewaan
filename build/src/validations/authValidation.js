import Joi from "joi";
const signup = {
    body: Joi.object()
        .keys({
        admin_username: Joi.string().trim().max(50).required(),
        admin_password: Joi.string()
            .trim()
            .min(8)
            .max(255)
            .required()
            .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
            .messages({
            "string.pattern.base": "Password must contains uppercase letters, lowercase letters, numbers, and special characters."
        }),
        confirm_password: Joi.string()
            .trim()
            .required()
            .valid(Joi.ref("admin_password"))
            .messages({
            "any.only": "Password and confirmation must be the same."
        })
            .strip()
    })
        .options({ stripUnknown: true })
};
const signin = {
    body: Joi.object()
        .keys({
        admin_username: Joi.string().trim().max(50).required(),
        admin_password: Joi.string().trim().min(8).required()
    })
        .options({ stripUnknown: true })
};
export default { signup, signin };
