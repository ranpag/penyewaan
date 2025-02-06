import Joi from "joi";
import prisma from "~/src/database/prisma";
import errorAPI from "@utils/errorAPI";
import { Express } from "express";

const uniqueNoTelp = async (value: string, _helper: Joi.ExternalHelpers) => {
    const customerNoTelp = await prisma.pelanggan.findUnique({
        where: { pelanggan_notelp: value }
    });
    if (customerNoTelp) {
        throw new Joi.ValidationError(
            "No Telp sudah digunakan",
            [
                {
                    message: "No Telp sudah digunakan",
                    path: ["pelanggan_notelp"],
                    type: "unique",
                    context: { value }
                }
            ],
            value
        );
    }
    return value;
};

const uniqueEmail = async (value: string, _helper: Joi.ExternalHelpers) => {
    const pelanggan = await prisma.pelanggan.findUnique({
        where: { pelanggan_email: value }
    });
    if (pelanggan) {
        throw new Joi.ValidationError(
            "Email sudah digunakan",
            [
                {
                    message: "Email sudah digunakan",
                    path: ["pelanggan_email"],
                    type: "unique",
                    context: { value }
                }
            ],
            value
        );
    }
    return value;
};

const customerDataValidation = (pelanggan_data_jenis: string, pelanggan_data_file?: Express.Multer.File[]) => {
    if (pelanggan_data_jenis && (!pelanggan_data_file || pelanggan_data_file.length === 0)) {
        throw new errorAPI("Validation error", 400, ['"body" contains [pelanggan_data_jenis] without its required peers [pelanggan_data_file]']);
    }
    if (!pelanggan_data_jenis && pelanggan_data_file && pelanggan_data_file.length > 0) {
        throw new errorAPI("Validation error", 400, ['"body" contains [pelanggan_data_file] without its required peers [pelanggan_data_jenis]']);
    }
};

const selectedCustomer = {
    params: Joi.object().keys({
        customerId: Joi.alternatives().try(Joi.number().integer().positive(), Joi.string().pattern(/^\d+$/).empty("")).messages({
            "alternatives.match": "ID pelanggan harus berupa angka atau string yang hanya mengandung angka."
        })
    })
};

const createCustomer = {
    body: Joi.object()
        .keys({
            pelanggan_nama: Joi.string().trim().max(150).required().messages({
                "string.base": "Nama pelanggan harus berupa teks.",
                "string.empty": "Nama pelanggan tidak boleh kosong.",
                "string.max": "Nama pelanggan tidak boleh lebih dari 150 karakter.",
                "any.required": "Nama pelanggan wajib diisi."
            }),
            pelanggan_alamat: Joi.string().trim().max(200).required().messages({
                "string.base": "Alamat pelanggan harus berupa teks.",
                "string.empty": "Alamat pelanggan tidak boleh kosong.",
                "string.max": "Alamat pelanggan tidak boleh lebih dari 200 karakter.",
                "any.required": "Alamat pelanggan wajib diisi."
            }),
            pelanggan_notelp: Joi.string()
                .trim()
                .pattern(/^\d{10,13}$/)
                .required()
                .external(uniqueNoTelp)
                .messages({
                    "string.base": "Nomor telepon harus berupa teks.",
                    "string.empty": "Nomor telepon tidak boleh kosong.",
                    "string.pattern.base": "Nomor telepon harus berisi 10-13 digit angka.",
                    "any.required": "Nomor telepon wajib diisi."
                }),
            pelanggan_email: Joi.string().trim().email().max(100).required().external(uniqueEmail).messages({
                "string.base": "Email pelanggan harus berupa teks.",
                "string.empty": "Email pelanggan tidak boleh kosong.",
                "string.email": "Format email tidak valid.",
                "string.max": "Email tidak boleh lebih dari 100 karakter.",
                "any.required": "Email pelanggan wajib diisi."
            }),
            pelanggan_data_jenis: Joi.string().valid("KTP", "SIM").messages({
                "any.only": "Jenis data harus berupa KTP atau SIM."
            })
        })
        .options({ stripUnknown: true })
};

const updateCustomer = {
    body: Joi.object()
        .keys({
            pelanggan_nama: Joi.string().trim().max(150).messages({
                "string.base": "Nama pelanggan harus berupa teks.",
                "string.empty": "Nama pelanggan tidak boleh kosong.",
                "string.max": "Nama pelanggan tidak boleh lebih dari 150 karakter."
            }),
            pelanggan_alamat: Joi.string().trim().max(200).messages({
                "string.base": "Alamat pelanggan harus berupa teks.",
                "string.empty": "Alamat pelanggan tidak boleh kosong.",
                "string.max": "Alamat pelanggan tidak boleh lebih dari 200 karakter."
            }),
            pelanggan_notelp: Joi.string()
                .trim()
                .pattern(/^\d{10,13}$/)
                .messages({
                    "string.base": "Nomor telepon harus berupa teks.",
                    "string.empty": "Nomor telepon tidak boleh kosong.",
                    "string.pattern.base": "Nomor telepon harus berisi 10-13 digit angka."
                }),
            pelanggan_email: Joi.string().trim().email().max(100).messages({
                "string.base": "Email pelanggan harus berupa teks.",
                "string.empty": "Email pelanggan tidak boleh kosong.",
                "string.email": "Format email tidak valid.",
                "string.max": "Email tidak boleh lebih dari 100 karakter."
            }),
            pelanggan_data_jenis: Joi.string().valid("KTP", "SIM").messages({
                "any.only": "Jenis data harus berupa KTP atau SIM."
            })
        })
        .options({ stripUnknown: true }),
    params: Joi.object().keys({
        customerId: Joi.alternatives().try(Joi.number().integer().positive(), Joi.string().pattern(/^\d+$/).empty("")).required().messages({
            "alternatives.match": "ID pelanggan harus berupa angka atau string yang hanya mengandung angka.",
            "any.required": "ID pelanggan wajib diisi."
        })
    })
};

const destroyCustomer = {
    params: Joi.object().keys({
        customerId: Joi.alternatives().try(Joi.number().integer().positive(), Joi.string().pattern(/^\d+$/).empty("")).required().messages({
            "alternatives.match": "ID pelanggan harus berupa angka atau string yang hanya mengandung angka.",
            "any.required": "ID pelanggan wajib diisi."
        })
    })
};

export default { selectedCustomer, createCustomer, customerDataValidation, updateCustomer, destroyCustomer };
