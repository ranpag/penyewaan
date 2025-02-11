import Joi from "joi";
import { errorAPI } from "../utils/errorAPI.js";
import prisma from "../database/prisma.js";
import { checkNaN } from "../utils/checkNaN.js";
const existingCustomer = async (value, _helper) => {
    if (!value)
        return;
    const { customerId } = checkNaN({ customerId: value });
    const customer = await prisma.pelanggan.findUnique({
        where: { pelanggan_id: customerId }
    });
    if (!customer) {
        throw new Joi.ValidationError(`Pelanggan dengan id ${customerId} tidak ada`, [
            {
                message: `Pelanggan dengan id ${customerId} tidak ada`,
                path: ["body", "pelanggan_data_pelanggan_id"],
                type: "existing",
                context: { label: "pelanggan_data_pelanggan_id", key: "pelanggan_data_pelanggan_id" }
            }
        ], value);
    }
    return value;
};
export const customerDataValidation = (pelanggan_data_jenis, pelanggan_data_file) => {
    if (pelanggan_data_jenis && (!pelanggan_data_file || pelanggan_data_file.length === 0)) {
        throw new errorAPI("Validation error", 400, { pelanggan_data_file: ["File harus ada saat membuat jenis data pelanggan"] });
    }
    if (!pelanggan_data_jenis && pelanggan_data_file && pelanggan_data_file.length > 0) {
        throw new errorAPI("Validation error", 400, { pelanggan_data_jenis: ["Jenis file data pelanggan harus ada saat membuat"] });
    }
};
const selectedCustomerData = {
    params: Joi.object().keys({
        customerDataId: Joi.alternatives().try(Joi.number().integer().positive(), Joi.string().pattern(/^\d+$/).empty("")).messages({
            "alternatives.match": "ID data pelanggan harus berupa angka atau string yang hanya mengandung angka."
        })
    })
};
const createCustomerData = {
    body: Joi.object()
        .keys({
        pelanggan_data_pelanggan_id: Joi.number().integer().positive().required().external(existingCustomer).messages({
            "number.base": "ID pelanggan harus berupa angka.",
            "number.integer": "ID pelanggan harus berupa angka bulat.",
            "number.positive": "ID pelanggan harus bernilai positif.",
            "any.required": "ID pelanggan wajib diisi."
        }),
        pelanggan_data_jenis: Joi.string().valid("KTP", "SIM").required().messages({
            "string.base": "Jenis data harus berupa teks.",
            "any.only": "Jenis data harus berupa KTP atau SIM.",
            "any.required": "Jenis data wajib diisi."
        })
    })
        .options({ stripUnknown: true })
};
const updateCustomerData = {
    body: Joi.object()
        .keys({
        pelanggan_data_pelanggan_id: Joi.number().integer().positive().external(existingCustomer).messages({
            "number.base": "ID pelanggan harus berupa angka.",
            "number.integer": "ID pelanggan harus berupa angka bulat.",
            "number.positive": "ID pelanggan harus bernilai positif."
        }),
        pelanggan_data_jenis: Joi.string().valid("KTP", "SIM").messages({
            "string.base": "Jenis data harus berupa teks.",
            "any.only": "Jenis data harus berupa KTP atau SIM."
        })
    })
        .options({ stripUnknown: true }),
    params: Joi.object().keys({
        customerDataId: Joi.alternatives().try(Joi.number().integer().positive(), Joi.string().pattern(/^\d+$/).empty("")).required().messages({
            "alternatives.match": "ID data pelanggan harus berupa angka atau string yang hanya mengandung angka.",
            "any.required": "ID data pelanggan wajib diisi."
        })
    })
};
const destroyCustomerData = {
    params: Joi.object().keys({
        customerDataId: Joi.alternatives().try(Joi.number().integer().positive(), Joi.string().pattern(/^\d+$/).empty("")).required().messages({
            "alternatives.match": "ID data pelanggan harus berupa angka atau string yang hanya mengandung angka.",
            "any.required": "ID data pelanggan wajib diisi."
        })
    })
};
export default { selectedCustomerData, createCustomerData, customerDataValidation, updateCustomerData, destroyCustomerData };
