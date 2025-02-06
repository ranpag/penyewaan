import Joi from "joi";
const selectedRental = {
    params: Joi.object().keys({
        rentalId: Joi.alternatives().try(Joi.number(), Joi.string().pattern(/^\d+$/).empty("")).required()
    })
};
const postRental = {
    body: Joi.object()
        .keys({
        penyewaan_pelanggan_id: Joi.number().integer().required(),
        penyewaan_tglkembali: Joi.date().iso().required(),
        penyewaan_sttspembayaran: Joi.string().valid("BELUM_DIBAYAR", "LUNAS", "DP").default("BELUM_DIBAYAR"),
        penyewaan_sttskembali: Joi.string().valid("BELUM_KEMBALI", "SUDAH_KEMBALI").default("BELUM_KEMBALI"),
        daftar_alat: Joi.array().items(Joi.object().keys({
            alat_id: Joi.number().integer().min(1).required(),
            jumlah: Joi.number().integer().min(1).required()
        }))
    })
        .options({ stripUnknown: true })
};
const putRental = {
    body: Joi.object()
        .keys({
        penyewaan_tglkembali: Joi.date().iso().required(),
        penyewaan_sttspembayaran: Joi.string().valid("BELUM_DIBAYAR", "LUNAS", "DP").default("BELUM_DIBAYAR"),
        penyewaan_sttskembali: Joi.string().valid("BELUM_KEMBALI", "SUDAH_KEMBALI").default("BELUM_KEMBALI"),
        daftar_alat: Joi.array()
            .items(Joi.object().keys({
            alat_id: Joi.number().integer().min(1).required(),
            jumlah: Joi.number().integer().min(1).required()
        }))
            .min(1)
            .required()
    })
        .options({ stripUnknown: true }),
    params: Joi.object().keys({
        rentalId: Joi.alternatives().try(Joi.number(), Joi.string().pattern(/^\d+$/).empty("")).required()
    })
};
const patchRental = {
    body: Joi.object()
        .keys({
        penyewaan_tglkembali: Joi.date().iso(),
        penyewaan_sttspembayaran: Joi.string().valid("BELUM_DIBAYAR", "LUNAS", "DP"),
        penyewaan_sttskembali: Joi.string().valid("BELUM_KEMBALI", "SUDAH_KEMBALI"),
        daftar_alat: Joi.array().items(Joi.object().keys({
            alat_id: Joi.number().integer().min(1).required(),
            jumlah: Joi.number().integer().min(1).required()
        }))
    })
        .options({ stripUnknown: true }),
    params: Joi.object().keys({
        rentalId: Joi.alternatives().try(Joi.number(), Joi.string().pattern(/^\d+$/).empty("")).required()
    })
};
const destroyRental = {
    params: Joi.object().keys({
        rentalId: Joi.alternatives().try(Joi.number(), Joi.string().pattern(/^\d+$/).empty("")).required()
    })
};
export default { selectedRental, postRental, putRental, patchRental, destroyRental };
