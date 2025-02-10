import Joi from "joi";
import prisma from "../database/prisma";

const uniqueUsername = async (value: string, _helper: Joi.ExternalHelpers) => {
    const admin_username = await prisma.admin.findUnique({
        where: { admin_username: value }
    });
    if (admin_username) {
        throw new Joi.ValidationError(
            "Admin username sudah ada",
            [
                {
                    message: "Admin username sudah ada",
                    path: ["body", "admin_username"],
                    type: "unique",
                    context: { label: "admin_username", key: "admin_username" }
                }
            ],
            value
        );
    }
    return value;
};

const signup = {
    body: Joi.object()
        .keys({
            admin_username: Joi.string().trim().max(50).required().external(uniqueUsername).messages({
                "string.base": "Admin username admin harus berupa teks",
                "string.empty": "Admin username admin tidak boleh kosong",
                "string.max": "Admin username admin tidak boleh lebih dari 50 kaAdmin username admin tidak boleh lebih dari 50 karakterrakter",
                "any.required": "Admin username admin wajib diisi"
            }),
            admin_password: Joi.string()
                .trim()
                .min(8)
                .max(255)
                .required()
                .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
                .messages({
                    "string.base": "Password admin harus berupa teks",
                    "string.empty": "Password admin tidak boleh kosong",
                    "string.min": "Password admin harus memiliki minimal 8 karakter",
                    "string.max": "Password admin tidak boleh lebih dari 255 karakter",
                    "any.required": "Password admin wajib diisi",
                    "string.pattern.base":
                        "Password admin harus mengandung minimal satu huruf besar, satu huruf kecil, satu angka, dan satu karakter spesial (@$!%*?&)"
                }),
            confirm_password: Joi.string()
                .trim()
                .required()
                .valid(Joi.ref("admin_password"))
                .messages({
                    "string.base": "Konfirmasi password harus berupa teks.",
                    "string.empty": "Konfirmasi password tidak boleh kosong.",
                    "any.required": "Konfirmasi password wajib diisi.",
                    "any.only": "Konfirmasi password harus sama dengan password admin."
                })
                .strip()
        })
        .options({ stripUnknown: true })
};

const signin = {
    body: Joi.object()
        .keys({
            admin_username: Joi.string().trim().required().messages({
                "string.base": "Username harus berupa teks.",
                "string.empty": "Username tidak boleh kosong.",
                "any.required": "Username wajib diisi."
            }),
            admin_password: Joi.string().trim().required().messages({
                "string.base": "Password harus berupa teks.",
                "string.empty": "Password tidak boleh kosong.",
                "any.required": "Password wajib diisi."
            })
        })
        .options({ stripUnknown: true })
};

const changePassword = {
    body: Joi.object()
        .keys({
            new_password: Joi.string()
                .trim()
                .min(8)
                .max(255)
                .required()
                .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
                .messages({
                    "string.base": "Password baru harus berupa teks",
                    "string.empty": "Password baru tidak boleh kosong",
                    "string.min": "Password baru harus memiliki minimal 8 karakter",
                    "string.max": "Password baru tidak boleh lebih dari 255 karakter",
                    "any.required": "Password baru wajib diisi",
                    "string.pattern.base":
                        "Password baru harus mengandung minimal satu huruf besar, satu huruf kecil, satu angka, dan satu karakter spesial (@$!%*?&)"
                }),
            confirm_password: Joi.string()
                .trim()
                .required()
                .valid(Joi.ref("new_password"))
                .messages({
                    "string.base": "Konfirmasi password harus berupa teks.",
                    "string.empty": "Konfirmasi password tidak boleh kosong.",
                    "any.required": "Konfirmasi password wajib diisi.",
                    "any.only": "Konfirmasi password harus sama dengan password baru."
                })
                .strip()
        })
        .options({ stripUnknown: true })
};

const resetPassword = {
    body: Joi.object()
        .keys({
            admin_username: Joi.string().trim().required().messages({
                "string.base": "Username harus berupa teks.",
                "string.empty": "Username tidak boleh kosong.",
                "any.required": "Username wajib diisi."
            }),
            new_password: Joi.string()
                .trim()
                .min(8)
                .max(255)
                .required()
                .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
                .messages({
                    "string.base": "Password baru harus berupa teks",
                    "string.empty": "Password baru tidak boleh kosong",
                    "string.min": "Password baru harus memiliki minimal 8 karakter",
                    "string.max": "Password baru tidak boleh lebih dari 255 karakter",
                    "any.required": "Password baru wajib diisi",
                    "string.pattern.base":
                        "Password baru harus mengandung minimal satu huruf besar, satu huruf kecil, satu angka, dan satu karakter spesial (@$!%*?&)"
                }),
            confirm_password: Joi.string()
                .trim()
                .required()
                .valid(Joi.ref("new_password"))
                .messages({
                    "string.base": "Konfirmasi password harus berupa teks.",
                    "string.empty": "Konfirmasi password tidak boleh kosong.",
                    "any.required": "Konfirmasi password wajib diisi.",
                    "any.only": "Konfirmasi password harus sama dengan password baru."
                })
                .strip()
        })
        .options({ stripUnknown: true })
};

export default { signup, signin, changePassword, resetPassword };
