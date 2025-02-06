import Joi from "joi";
import prisma from "../database/prisma";

const uniqueCategoryName = async (value: string, _helper: Joi.ExternalHelpers) => {
    const categoryName = await prisma.kategori.findUnique({
        where: { kategori_nama: value }
    });
    if (categoryName) {
        throw new Joi.ValidationError(
            "Nama kategori sudah ada",
            [
                {
                    message: "Nama kategori sudah ada",
                    path: ["kategori_nama"],
                    type: "unique",
                    context: { value }
                }
            ],
            value
        );
    }
    return value;
};

const selectedCategory = {
    params: Joi.object().keys({
        categoryId: Joi.alternatives().try(Joi.number().integer().positive(), Joi.string().pattern(/^\d+$/).empty("")).messages({
            "alternatives.match": "ID kategori harus berupa angka atau string yang hanya mengandung angka."
        })
    })
};

const createCategory = {
    body: Joi.object()
        .keys({
            kategori_nama: Joi.string().trim().max(100).required().external(uniqueCategoryName).messages({
                "string.base": "Nama kategori harus berupa teks.",
                "string.empty": "Nama kategori tidak boleh kosong.",
                "string.max": "Nama kategori tidak boleh lebih dari 100 karakter.",
                "any.required": "Nama kategori wajib diisi."
            })
        })
        .options({ stripUnknown: true })
};

const updateCategory = {
    body: Joi.object()
        .keys({
            kategori_nama: Joi.string().trim().max(100).messages({
                "string.base": "Nama kategori harus berupa teks.",
                "string.empty": "Nama kategori tidak boleh kosong.",
                "string.max": "Nama kategori tidak boleh lebih dari 100 karakter."
            })
        })
        .options({ stripUnknown: true }),
    params: Joi.object().keys({
        categoryId: Joi.alternatives().try(Joi.number().integer().positive(), Joi.string().pattern(/^\d+$/).empty("")).required().messages({
            "alternatives.match": "ID kategori harus berupa angka atau string yang hanya mengandung angka.",
            "any.required": "ID kategori wajib diisi."
        })
    })
};

const destroyCategory = {
    params: Joi.object().keys({
        categoryId: Joi.alternatives().try(Joi.number().integer().positive(), Joi.string().pattern(/^\d+$/).empty("")).required().messages({
            "alternatives.match": "ID kategori harus berupa angka atau string yang hanya mengandung angka.",
            "any.required": "ID kategori wajib diisi."
        })
    })
};

export default { selectedCategory, createCategory, updateCategory, destroyCategory };
