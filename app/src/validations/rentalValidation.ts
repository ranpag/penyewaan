import Joi from "joi";
import { checkNaN } from "../utils/checkNaN";
import prisma from "../database/prisma";

const existingCustomer = async (value: string | number, _helper: Joi.ExternalHelpers) => {
    if (!value) return;
    const { customerId } = checkNaN({ customerId: value });
    const customer = await prisma.pelanggan.findUnique({
        where: { pelanggan_id: customerId }
    });
    if (!customer) {
        throw new Joi.ValidationError(
            `Pelanggan dengan id ${customerId} tidak ada`,
            [
                {
                    message: `Pelanggan dengan id ${customerId} tidak ada`,
                    path: ["body", "penyewaan_pelanggan_id"],
                    type: "existing",
                    context: { label: "penyewaan_pelanggan_id", key: "penyewaan_pelanggan_id" }
                }
            ],
            value
        );
    }
    return value;
};

const existingTools = async (toolIds: number[]) => {
    const existingAlat = await prisma.alat.findMany({
        where: {
            alat_id: { in: toolIds }
        },
        select: { alat_id: true }
    });

    const existingToolIds = existingAlat.map((alat) => alat.alat_id);
    const missingToolIds = toolIds.filter((id) => !existingToolIds.includes(id));

    if (missingToolIds.length > 0) {
        throw new Joi.ValidationError(
            `ID alat berikut tidak ditemukan: ${missingToolIds.join(", ")}`,
            [
                {
                    message: `ID alat berikut tidak ditemukan: ${missingToolIds.join(", ")}`,
                    path: ["body", "daftar_alat", "alat_id"],
                    type: "existing",
                    context: { label: "alat_id", key: "alat_id" }
                }
            ],
            toolIds
        );
    }

    return toolIds;
};

const selectedRental = {
    params: Joi.object().keys({
        rentalId: Joi.alternatives().try(Joi.number().integer().positive(), Joi.string().pattern(/^\d+$/).empty("")).messages({
            "alternatives.match": "ID penyewaan harus berupa angka atau string yang hanya mengandung angka."
        })
    })
};

const createRental = {
    body: Joi.object()
        .keys({
            penyewaan_pelanggan_id: Joi.number().integer().positive().required().external(existingCustomer).messages({
                "number.base": "ID pelanggan harus berupa angka.",
                "number.integer": "ID pelanggan harus berupa angka bulat.",
                "number.positive": "ID pelanggan harus bernilai positif.",
                "any.required": "ID pelanggan wajib diisi."
            }),
            penyewaan_tglkembali: Joi.date().greater("now").iso().required().messages({
                "date.base": "Tanggal kembali harus berupa format tanggal yang valid.",
                "date.greater": "Tanggal kembali harus diatas tanggal sekarang.",
                "date.format": "Format tanggal kembali harus dalam format ISO.",
                "any.required": "Tanggal kembali wajib diisi."
            }),
            penyewaan_sttspembayaran: Joi.string().valid("BELUM_DIBAYAR", "LUNAS", "DP").default("BELUM_DIBAYAR").messages({
                "any.only": "Status pembayaran harus salah satu dari: BELUM_DIBAYAR, LUNAS, atau DP."
            }),
            penyewaan_sttskembali: Joi.string().valid("BELUM_KEMBALI", "SUDAH_KEMBALI").default("BELUM_KEMBALI").messages({
                "any.only": "Status kembali harus salah satu dari: BELUM_KEMBALI atau SUDAH_KEMBALI."
            }),
            daftar_alat: Joi.array()
                .items(
                    Joi.object().keys({
                        alat_id: Joi.number().integer().positive().required().messages({
                            "number.base": "ID alat harus berupa angka.",
                            "number.integer": "ID alat harus berupa angka bulat.",
                            "number.positive": "ID alat harus bernilai positif.",
                            "any.required": "ID alat wajib diisi."
                        }),
                        jumlah: Joi.number().integer().positive().min(1).required().messages({
                            "number.base": "Jumlah harus berupa angka.",
                            "number.integer": "Jumlah harus berupa angka bulat.",
                            "number.positive": "Jumlah harus bernilai positif.",
                            "number.min": "Jumlah harus minimal 1.",
                            "any.required": "Jumlah alat wajib diisi."
                        })
                    })
                )
                .default([])
                .external(async (items: { alat_id: number; jumlah: number }[]) => {
                    if (items.length === 0 || !items) return;
                    const alatIds = items.map((item: { alat_id: number; jumlah: number }) => item.alat_id);
                    await existingTools(alatIds);
                    return items;
                })
        })
        .options({ stripUnknown: true })
};

const updateRental = {
    body: Joi.object()
        .keys({
            penyewaan_pelanggan_id: Joi.number().integer().positive().external(existingCustomer).messages({
                "number.base": "ID pelanggan harus berupa angka.",
                "number.integer": "ID pelanggan harus berupa angka bulat.",
                "number.positive": "ID pelanggan harus bernilai positif."
            }),
            penyewaan_tglkembali: Joi.date().iso().messages({
                "date.base": "Tanggal kembali harus berupa format tanggal yang valid.",
                "date.format": "Format tanggal kembali harus dalam format ISO."
            }),
            penyewaan_sttspembayaran: Joi.string().valid("BELUM_DIBAYAR", "LUNAS", "DP").messages({
                "any.only": "Status pembayaran harus salah satu dari: BELUM_DIBAYAR, LUNAS, atau DP."
            }),
            penyewaan_sttskembali: Joi.string().valid("BELUM_KEMBALI", "SUDAH_KEMBALI").messages({
                "any.only": "Status kembali harus salah satu dari: BELUM_KEMBALI atau SUDAH_KEMBALI."
            }),
            daftar_alat: Joi.array()
                .items(
                    Joi.object().keys({
                        alat_id: Joi.number().integer().positive().required().messages({
                            "number.base": "ID alat harus berupa angka.",
                            "number.integer": "ID alat harus berupa angka bulat.",
                            "number.positive": "ID alat harus bernilai positif.",
                            "any.required": "ID alat wajib diisi."
                        }),
                        jumlah: Joi.number().integer().positive().min(1).required().messages({
                            "number.base": "Jumlah harus berupa angka.",
                            "number.integer": "Jumlah harus berupa angka bulat.",
                            "number.positive": "Jumlah harus bernilai positif.",
                            "number.min": "Jumlah harus minimal 1.",
                            "any.required": "Jumlah alat wajib diisi."
                        })
                    })
                )
                .external(async (items: { alat_id: number; jumlah: number }[]) => {
                    if ((Array.isArray(items) && items.length === 0) || !items) return items;
                    const alatIds = items.map((item: { alat_id: number; jumlah: number }) => item.alat_id);
                    await existingTools(alatIds);
                    return items;
                })
        })
        .options({ stripUnknown: true }),
    params: Joi.object().keys({
        rentalId: Joi.alternatives().try(Joi.number().integer().positive(), Joi.string().pattern(/^\d+$/).empty("")).required().messages({
            "alternatives.match": "ID penyewaan harus berupa angka atau string yang hanya mengandung angka.",
            "any.required": "ID penyewaan wajib diisi."
        })
    })
};

const destroyRental = {
    params: Joi.object().keys({
        rentalId: Joi.alternatives().try(Joi.number().integer().positive(), Joi.string().pattern(/^\d+$/).empty("")).required().messages({
            "alternatives.match": "ID penyewaan harus berupa angka atau string yang hanya mengandung angka.",
            "any.required": "ID penyewaan wajib diisi."
        })
    })
};

export default { selectedRental, createRental, updateRental, destroyRental };
