import Joi from "joi";
import prisma from "../../src/database/prisma.js";
const selectedTool = {
    params: Joi.object().keys({
        toolId: Joi.alternatives().try(Joi.number(), Joi.string().pattern(/^\d+$/).empty("")).required()
    })
};
const postTool = {
    body: Joi.object()
        .keys({
        alat_nama: Joi.string().trim().max(150).required(),
        alat_deskripsi: Joi.string().trim().max(255).required(),
        alat_hargaperhari: Joi.number().integer().min(1).required(),
        alat_stok: Joi.number().integer().min(1).required(),
        alat_kategori_id: Joi.number()
            .integer()
            .required()
            .custom(async (value, helper) => {
            const category = await prisma.kategori.findUnique({
                where: { kategori_id: value }
            });
            if (!category)
                return helper.message({ "string.base": "Category Id not exist" });
            return value;
        }, "Category Id exist Validation")
    })
        .options({ stripUnknown: true })
};
const putTool = {
    body: Joi.object()
        .keys({
        alat_nama: Joi.string().trim().max(150).required(),
        alat_deskripsi: Joi.string().trim().max(255).required(),
        alat_hargaperhari: Joi.number().integer().min(1).required(),
        alat_stok: Joi.number().integer().min(1).required(),
        alat_kategori_id: Joi.number()
            .integer()
            .required()
            .custom(async (value, helper) => {
            const category = await prisma.kategori.findUnique({
                where: { kategori_id: value }
            });
            if (!category)
                return helper.message({ "string.base": "Category Id not exist" });
            return value;
        }, "Category Id exist Validation")
    })
        .options({ stripUnknown: true }),
    params: Joi.object().keys({
        toolId: Joi.alternatives().try(Joi.number(), Joi.string().pattern(/^\d+$/).empty("")).required()
    })
};
const patchTool = {
    body: Joi.object()
        .keys({
        alat_nama: Joi.string().trim().max(150),
        alat_deskripsi: Joi.string().trim().max(255),
        alat_hargaperhari: Joi.number().integer().min(1),
        alat_stok: Joi.number().integer().min(1),
        alat_kategori_id: Joi.number()
            .integer()
            .custom(async (value, helper) => {
            const category = await prisma.kategori.findUnique({
                where: { kategori_id: value }
            });
            if (!category)
                return helper.message({ "string.base": "Category Id not exist" });
            return value;
        }, "Category Id exist Validation")
    })
        .options({ stripUnknown: true }),
    params: Joi.object().keys({
        toolId: Joi.alternatives().try(Joi.number(), Joi.string().pattern(/^\d+$/).empty("")).required()
    })
};
const destroyTool = {
    params: Joi.object().keys({
        toolId: Joi.alternatives().try(Joi.number(), Joi.string().pattern(/^\d+$/).empty("")).required()
    })
};
export default { selectedTool, postTool, putTool, patchTool, destroyTool };
