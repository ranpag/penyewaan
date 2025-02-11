import Joi from "joi";

const destroyAdmin = {
    body: Joi.object()
        .keys({
            your_password: Joi.string().trim().required().messages({
                "string.base": "Password harus berupa teks.",
                "string.empty": "Password tidak boleh kosong.",
                "any.required": "Password wajib diisi."
            })
        })
        .options({ stripUnknown: true })
};

export default { destroyAdmin };