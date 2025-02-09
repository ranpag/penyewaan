import Joi from "joi";
import prisma from "~/src/database/prisma";
import { checkNaN } from "../utils/checkNaN";

const existingCategory = async (value: string | number, _helper: Joi.ExternalHelpers) => {
    if (!value) return;
    const { categoryId } = checkNaN({ categoryId: value });
    const category = await prisma.kategori.findUnique({
        where: { kategori_id: categoryId }
    });
    if (!category) {
        throw new Joi.ValidationError(
            `Kategori dengan id ${categoryId} tidak ada`,
            [
                {
                    message: `Kategori dengan id ${categoryId} tidak ada`,
                    path: ["body", "alat_kategori_id"],
                    type: "existing",
                    context: { label: "alat_kategori_id", key: "alat_kategori_id" }
                }
            ],
            value
        );
    }
    return value;
};

const selectedTool = {
    params: Joi.object().keys({
        toolId: Joi.alternatives().try(Joi.number().integer().positive(), Joi.string().pattern(/^\d+$/).empty("")).messages({
            "alternatives.match": "ID alat harus berupa angka atau string yang hanya mengandung angka."
        })
    })
};

const createTool = {
    body: Joi.object()
        .keys({
            alat_nama: Joi.string().trim().max(150).required().messages({
                "string.base": "Nama alat harus berupa teks.",
                "string.empty": "Nama alat tidak boleh kosong.",
                "string.max": "Nama alat tidak boleh lebih dari 150 karakter.",
                "any.required": "Nama alat wajib diisi."
            }),
            alat_deskripsi: Joi.string().trim().max(255).required().messages({
                "string.base": "Deskripsi alat harus berupa teks.",
                "string.empty": "Deskripsi alat tidak boleh kosong.",
                "string.max": "Deskripsi alat tidak boleh lebih dari 255 karakter.",
                "any.required": "Deskripsi alat wajib diisi."
            }),
            alat_hargaperhari: Joi.number().integer().positive().min(1).required().messages({
                "number.base": "Harga per hari harus berupa angka.",
                "number.integer": "Harga per hari harus berupa angka bulat.",
                "number.positive": "Harga per hari harus bernilai positif.",
                "number.min": "Harga per hari minimal 1.",
                "any.required": "Harga per hari wajib diisi."
            }),
            alat_stok: Joi.number().integer().positive().min(1).required().messages({
                "number.base": "Stok alat harus berupa angka.",
                "number.integer": "Stok alat harus berupa angka bulat.",
                "number.positive": "Stok alat harus bernilai positif.",
                "number.min": "Stok alat minimal 1.",
                "any.required": "Stok alat wajib diisi."
            }),
            alat_kategori_id: Joi.number().integer().positive().required().external(existingCategory).messages({
                "number.base": "ID kategori alat harus berupa angka.",
                "number.integer": "ID kategori alat harus berupa angka bulat.",
                "number.positive": "ID kategori alat harus bernilai positif.",
                "any.required": "ID kategori alat wajib diisi."
            })
        })
        .options({ stripUnknown: true })
};

const updateTool = {
    body: Joi.object()
        .keys({
            alat_nama: Joi.string().trim().max(150).messages({
                "string.base": "Nama alat harus berupa teks.",
                "string.empty": "Nama alat tidak boleh kosong.",
                "string.max": "Nama alat tidak boleh lebih dari 150 karakter."
            }),
            alat_deskripsi: Joi.string().trim().max(255).messages({
                "string.base": "Deskripsi alat harus berupa teks.",
                "string.empty": "Deskripsi alat tidak boleh kosong.",
                "string.max": "Deskripsi alat tidak boleh lebih dari 255 karakter."
            }),
            alat_hargaperhari: Joi.number().integer().positive().min(1).messages({
                "number.base": "Harga per hari harus berupa angka.",
                "number.integer": "Harga per hari harus berupa angka bulat.",
                "number.positive": "Harga per hari harus bernilai positif.",
                "number.min": "Harga per hari minimal 1."
            }),
            alat_stok: Joi.number().integer().positive().min(1).messages({
                "number.base": "Stok alat harus berupa angka.",
                "number.integer": "Stok alat harus berupa angka bulat.",
                "number.positive": "Stok alat harus bernilai positif.",
                "number.min": "Stok alat minimal 1."
            }),
            alat_kategori_id: Joi.number().integer().positive().external(existingCategory).messages({
                "number.base": "ID kategori alat harus berupa angka.",
                "number.integer": "ID kategori alat harus berupa angka bulat.",
                "number.positive": "ID kategori alat harus bernilai positif."
            })
        })
        .options({ stripUnknown: true }),
    params: Joi.object().keys({
        toolId: Joi.alternatives().try(Joi.number().integer().positive(), Joi.string().pattern(/^\d+$/).empty("")).required().messages({
            "alternatives.match": "ID alat harus berupa angka atau string yang hanya mengandung angka.",
            "any.required": "ID alat wajib diisi."
        })
    })
};

const destroyTool = {
    params: Joi.object().keys({
        toolId: Joi.alternatives().try(Joi.number().integer().positive(), Joi.string().pattern(/^\d+$/).empty("")).required().messages({
            "alternatives.match": "ID alat harus berupa angka atau string yang hanya mengandung angka.",
            "any.required": "ID alat wajib diisi."
        })
    })
};

export default { selectedTool, createTool, updateTool, destroyTool };
