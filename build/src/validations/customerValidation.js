import Joi from "joi";
import prisma from "../../src/database/prisma.js";
import errorAPI from "../utils/errorAPI.js";
const selectedCustomer = {
    params: Joi.object().keys({
        customerId: Joi.alternatives().try(Joi.number(), Joi.string().pattern(/^\d+$/).empty("")).required()
    })
};
const createCustomer = {
    body: Joi.object()
        .keys({
        pelanggan_nama: Joi.string().trim().max(150).required(),
        pelanggan_alamat: Joi.string().trim().max(200).required(),
        pelanggan_notelp: Joi.string()
            .trim()
            .pattern(/^\d{10,13}$/)
            .required()
            .messages({ "string.pattern.base": "Nomor telepon harus berisi 10-13 digit angka." })
            .custom(async (value, helper) => {
            const pelanggan = await prisma.pelanggan.findUnique({
                where: { pelanggan_notelp: value }
            });
            if (pelanggan)
                return helper.message({ "string.base": "No telp already exists" });
            return value;
        }, "Unique No Telp Validation"),
        pelanggan_email: Joi.string()
            .trim()
            .email()
            .max(100)
            .required()
            .custom(async (value, helper) => {
            const pelanggan = await prisma.pelanggan.findUnique({
                where: { pelanggan_email: value }
            });
            if (pelanggan)
                return helper.message({ "string.base": "Email already exists" });
            return value;
        }, "Unique Email Validation"),
        pelanggan_data_jenis: Joi.string().valid("KTP", "SIM")
    })
        .options({ stripUnknown: true })
};
const customerDataValidation = (pelanggan_data_jenis, pelanggan_data_file) => {
    if (pelanggan_data_jenis && (!pelanggan_data_file || pelanggan_data_file.length === 0)) {
        throw new errorAPI("Validation error", 400, ['"body" contains [pelanggan_data_jenis] without its required peers [pelanggan_data_file]']);
    }
    if (!pelanggan_data_jenis && pelanggan_data_file && pelanggan_data_file.length > 0) {
        throw new errorAPI("Validation error", 400, ['"body" contains [pelanggan_data_file] without its required peers [pelanggan_data_jenis]']);
    }
};
const putCustomer = {
    body: Joi.object()
        .keys({
        pelanggan_nama: Joi.string().trim().max(150).required(),
        pelanggan_alamat: Joi.string().trim().max(200).required(),
        pelanggan_notelp: Joi.string()
            .trim()
            .pattern(/^\d{10,13}$/)
            .required()
            .messages({ "string.pattern.base": "Nomor telepon harus berisi 10-13 digit angka." })
            .custom(async (value, helper) => {
            const pelanggan = await prisma.pelanggan.findUnique({
                where: { pelanggan_notelp: value }
            });
            if (pelanggan)
                return helper.message({ "string.base": "No telp already exists" });
            return value;
        }, "Unique No Telp Validation"),
        pelanggan_email: Joi.string()
            .trim()
            .email()
            .max(100)
            .required()
            .custom(async (value, helper) => {
            const pelanggan = await prisma.pelanggan.findUnique({
                where: { pelanggan_email: value }
            });
            if (pelanggan)
                return helper.message({ "string.base": "Email already exists" });
            return value;
        }, "Unique Email Validation"),
        pelanggan_data_jenis: Joi.string().valid("KTP", "SIM")
    })
        .options({ stripUnknown: true }),
    params: Joi.object().keys({
        customerId: Joi.alternatives().try(Joi.number(), Joi.string().pattern(/^\d+$/).empty("")).required()
    })
};
const patchCustomer = {
    body: Joi.object()
        .keys({
        pelanggan_nama: Joi.string().trim().max(150),
        pelanggan_alamat: Joi.string().trim().max(200),
        pelanggan_notelp: Joi.string()
            .trim()
            .pattern(/^\d{10,13}$/)
            .messages({ "string.pattern.base": "Nomor telepon harus berisi 10-13 digit angka." }),
        pelanggan_email: Joi.string().trim().email().max(100),
        pelanggan_data_jenis: Joi.string().valid("KTP", "SIM")
    })
        .options({ stripUnknown: true }),
    params: Joi.object().keys({
        customerId: Joi.alternatives().try(Joi.number(), Joi.string().pattern(/^\d+$/).empty("")).required()
    })
};
const destroyCustomer = {
    params: Joi.object().keys({
        customerId: Joi.alternatives().try(Joi.number(), Joi.string().pattern(/^\d+$/).empty("")).required()
    })
};
export default { selectedCustomer, createCustomer, customerDataValidation, putCustomer, patchCustomer, destroyCustomer };
