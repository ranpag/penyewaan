import { logger } from "../utils/logger.js";
import errorAPI from "../utils/errorAPI.js";
import prisma from "../../src/database/prisma.js";
import dayjs from "dayjs";
const index = async (req, res) => {
    try {
        const rentals = await prisma.penyewaan.findMany({
            take: 10,
            skip: parseInt(req.query.page) * 10 || 0
        });
        const totalRentals = await prisma.penyewaan.count();
        return res.status(200).json({
            success: true,
            message: "Succesfull retreived all rentals",
            data: rentals,
            pagination: {
                totalItem: rentals.length,
                totalData: totalRentals,
                totalPage: Math.floor(totalRentals / rentals.length)
            }
        });
    }
    catch (err) {
        logger.error("Error during fetching all rentals" + err);
        throw err;
    }
};
const selected = async (req, res) => {
    try {
        const rental = await prisma.penyewaan.findUnique({
            where: {
                penyewaan_id: parseInt(req.params.rentalId)
            },
            include: {
                pelanggan: true,
                penyewaan_detail: true
            }
        });
        if (!rental)
            throw new errorAPI("Rental not found", 404);
        return res.status(200).json({
            success: true,
            message: "Succesfull retreived selected rental",
            data: rental
        });
    }
    catch (err) {
        logger.error("Error during fetching selected rental" + err);
        throw err;
    }
};
const create = async (req, res) => {
    const { daftar_alat, penyewaan_pelanggan_id, penyewaan_tglkembali, ...rentalData } = req.body;
    const intValue = {};
    const pelangganId = Number(penyewaan_pelanggan_id);
    const rentalDate = dayjs().toISOString();
    const rentalReturnDate = dayjs(penyewaan_tglkembali).toISOString();
    try {
        if (!isNaN(pelangganId)) {
            intValue.penyewaan_pelanggan_id = pelangganId;
        }
        else {
            throw new errorAPI("Customer Id invalid", 400);
        }
        const result = await prisma.$transaction(async (tx) => {
            const newRental = await tx.penyewaan.create({
                data: {
                    penyewaan_tglsewa: rentalDate,
                    penyewaan_totalharga: 0,
                    penyewaan_tglkembali: rentalReturnDate,
                    ...intValue,
                    ...rentalData
                }
            });
            if (!Array.isArray(daftar_alat) || daftar_alat.length === 0) {
                return newRental;
            }
            const toolIds = daftar_alat.map((item) => Number(item.alat_id));
            const tools = await tx.alat.findMany({
                where: { alat_id: { in: toolIds } }
            });
            const rentalDetail = await Promise.all(daftar_alat.map(async (item) => {
                const tool = tools.find((tool) => tool.alat_id === Number(item.alat_id));
                const subharga = tool ? tool.alat_hargaperhari * Number(item.jumlah) : 0;
                if (tool) {
                    await tx.alat.update({
                        where: { alat_id: tool.alat_id },
                        data: {
                            alat_stok: { decrement: Number(item.jumlah) }
                        }
                    });
                }
                return {
                    penyewaan_detail_penyewaan_id: newRental.penyewaan_id,
                    penyewaan_detail_alat_id: Number(item.alat_id),
                    penyewaan_detail_jumlah: Number(item.jumlah),
                    penyewaan_detail_subharga: subharga
                };
            }));
            const totalHarga = rentalDetail.reduce((sum, item) => sum + item.penyewaan_detail_subharga, 0);
            await tx.penyewaan_detail.createMany({ data: rentalDetail });
            const updateNewRental = await tx.penyewaan.update({
                where: { penyewaan_id: newRental.penyewaan_id },
                data: { penyewaan_totalharga: totalHarga },
                include: { pelanggan: true, penyewaan_detail: true }
            });
            return updateNewRental;
        });
        return res.status(201).json({
            success: true,
            message: "Successfully created new rental",
            data: result
        });
    }
    catch (err) {
        logger.error("Error during creating newRental: " + err);
        throw err;
    }
};
const update = async (req, res) => {
    const { rentalId } = req.params;
    const { daftar_alat, penyewaan_tglkembali, ...rentalData } = req.body;
    const penyewaanId = Number(rentalId);
    try {
        if (isNaN(penyewaanId)) {
            throw new errorAPI("Invalid Rental ID", 400);
        }
        const result = await prisma.$transaction(async (tx) => {
            const existingRental = await tx.penyewaan.findUnique({
                where: { penyewaan_id: penyewaanId }
            });
            if (!existingRental)
                throw new errorAPI("Rental not found", 404);
            let totalHarga = 0;
            if (Array.isArray(daftar_alat) && daftar_alat.length > 0) {
                const rentalDetails = await tx.penyewaan_detail.findMany({
                    where: { penyewaan_detail_penyewaan_id: penyewaanId }
                });
                rentalDetails.forEach(async (item) => {
                    await tx.alat.update({
                        where: { alat_id: item.penyewaan_detail_alat_id },
                        data: { alat_stok: { increment: item.penyewaan_detail_jumlah } }
                    });
                });
                await tx.penyewaan_detail.deleteMany({
                    where: { penyewaan_detail_penyewaan_id: penyewaanId }
                });
                const toolIds = daftar_alat.map((item) => Number(item.alat_id));
                const tools = await tx.alat.findMany({
                    where: { alat_id: { in: toolIds } }
                });
                const rentalDetail = await Promise.all(daftar_alat.map(async (item) => {
                    const tool = tools.find((tool) => tool.alat_id === Number(item.alat_id));
                    const subharga = tool ? tool.alat_hargaperhari * Number(item.jumlah) : 0;
                    totalHarga += subharga;
                    if (tool) {
                        await tx.alat.update({
                            where: { alat_id: tool.alat_id },
                            data: {
                                alat_stok: { decrement: Number(item.jumlah) }
                            }
                        });
                    }
                    return {
                        penyewaan_detail_penyewaan_id: penyewaanId,
                        penyewaan_detail_alat_id: Number(item.alat_id),
                        penyewaan_detail_jumlah: Number(item.jumlah),
                        penyewaan_detail_subharga: subharga
                    };
                }));
                await tx.penyewaan_detail.createMany({ data: rentalDetail });
            }
            else {
                totalHarga = existingRental.penyewaan_totalharga;
            }
            const updatedRental = await tx.penyewaan.update({
                where: { penyewaan_id: penyewaanId },
                data: {
                    ...(penyewaan_tglkembali !== undefined && {
                        penyewaan_tglkembali: dayjs(penyewaan_tglkembali).toISOString()
                    }),
                    penyewaan_totalharga: totalHarga,
                    ...rentalData
                },
                include: { pelanggan: true, penyewaan_detail: true }
            });
            return updatedRental;
        });
        return res.status(200).json({
            success: true,
            message: "Successfully updated rental",
            data: result
        });
    }
    catch (err) {
        logger.error("Error during updating rental: " + err);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};
const destroy = async (req, res) => {
    try {
        await prisma.penyewaan.delete({
            where: {
                penyewaan_id: parseInt(req.params.rentalId)
            }
        });
        return res.status(204);
    }
    catch (err) {
        logger.error("Error during deleting alat: " + err);
        throw err;
    }
};
export default { index, selected, create, update, destroy };
