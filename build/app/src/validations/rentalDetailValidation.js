import Joi from "joi";
import { checkNaN } from "../utils/checkNaN.js";
import prisma from "../database/prisma.js";
const existingTool = async (value, _helper) => {
    if (!value)
        return;
    const { toolId } = checkNaN({ toolId: value });
    const customer = await prisma.alat.findUnique({
        where: { alat_id: toolId }
    });
    if (!customer) {
        throw new Joi.ValidationError(`Alat dengan id ${toolId} tidak ada`, [
            {
                message: `Alat dengan id ${toolId} tidak ada`,
                path: ["body", "penyewaan_detail_penyewaan_id"],
                type: "existing",
                context: { label: "penyewaan_detail_penyewaan_id", key: "penyewaan_detail_penyewaan_id" }
            }
        ], value);
    }
    return value;
};
const existingRental = async (value, _helper) => {
    if (!value)
        return;
    const { rentalId } = checkNaN({ rentalId: value });
    const customer = await prisma.penyewaan.findUnique({
        where: { penyewaan_id: rentalId }
    });
    if (!customer) {
        throw new Joi.ValidationError(`Penyewaan dengan id ${rentalId} tidak ada`, [
            {
                message: `Penyewaan dengan id ${rentalId} tidak ada`,
                path: ["body", "penyewaan_detail_alat_id"],
                type: "existing",
                context: { label: "penyewaan_detail_alat_id", key: "penyewaan_detail_alat_id" }
            }
        ], value);
    }
    return value;
};
const selectedRentalDetail = {
    params: Joi.object().keys({
        detailId: Joi.alternatives().try(Joi.number().integer().positive(), Joi.string().pattern(/^\d+$/).empty("")).messages({
            "alternatives.match": "ID detail penyewaan harus berupa angka atau string yang hanya mengandung angka."
        })
    })
};
const createRentalDetail = {
    body: Joi.object()
        .keys({
        penyewaan_detail_penyewaan_id: Joi.number().integer().positive().required().external(existingRental).messages({
            "number.base": "ID penyewaan harus berupa angka.",
            "number.integer": "ID penyewaan harus berupa angka bulat.",
            "number.positive": "ID penyewaan harus bernilai positif.",
            "any.required": "ID penyewaan wajib diisi."
        }),
        penyewaan_detail_alat_id: Joi.number().integer().positive().required().external(existingTool).messages({
            "number.base": "ID alat harus berupa angka.",
            "number.integer": "ID alat harus berupa angka bulat.",
            "number.positive": "ID alat harus bernilai positif.",
            "any.required": "ID alat wajib diisi."
        }),
        penyewaan_detail_jumlah: Joi.number().integer().positive().required().messages({
            "number.base": "Jumlah harus berupa angka.",
            "number.integer": "Jumlah harus berupa angka bulat.",
            "number.positive": "Jumlah harus bernilai positif.",
            "any.required": "Jumlah wajib diisi."
        })
    })
        .options({ stripUnknown: true })
};
const updateRentalDetail = {
    body: Joi.object()
        .keys({
        penyewaan_detail_penyewaan_id: Joi.number().integer().positive().external(existingRental).messages({
            "number.base": "ID penyewaan harus berupa angka.",
            "number.integer": "ID penyewaan harus berupa angka bulat.",
            "number.positive": "ID penyewaan harus bernilai positif."
        }),
        penyewaan_detail_alat_id: Joi.number().integer().positive().external(existingTool).messages({
            "number.base": "ID alat harus berupa angka.",
            "number.integer": "ID alat harus berupa angka bulat.",
            "number.positive": "ID alat harus bernilai positif."
        }),
        penyewaan_detail_jumlah: Joi.number().integer().positive().messages({
            "number.base": "Jumlah harus berupa angka.",
            "number.integer": "Jumlah harus berupa angka bulat.",
            "number.positive": "Jumlah harus bernilai positif."
        })
    })
        .options({ stripUnknown: true }),
    params: Joi.object().keys({
        detailId: Joi.alternatives().try(Joi.number().integer().positive(), Joi.string().pattern(/^\d+$/).empty("")).required().messages({
            "alternatives.match": "ID detail penyewaan harus berupa angka atau string yang hanya mengandung angka.",
            "any.required": "ID detail penyewaan wajib diisi."
        })
    })
};
const destroyRentalDetail = {
    params: Joi.object().keys({
        detailId: Joi.alternatives().try(Joi.number().integer().positive(), Joi.string().pattern(/^\d+$/).empty("")).required().messages({
            "alternatives.match": "ID detail penyewaan harus berupa angka atau string yang hanya mengandung angka.",
            "any.required": "ID detail penyewaan wajib diisi."
        })
    })
};
export default {
    selectedRentalDetail,
    createRentalDetail,
    updateRentalDetail,
    destroyRentalDetail
};
