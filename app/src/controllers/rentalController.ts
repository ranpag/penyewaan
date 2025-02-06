import { logger } from "@utils/logger";
import errorAPI from "@utils/errorAPI";
import { Request, Response } from "express";
import prisma from "~/src/database/prisma";
import dayjs from "dayjs";
import { checkNaN } from "../utils/checkNaN";
import { Prisma } from "@prisma/client";

const index = async (req: Request, res: Response) => {
    try {
        const rentals = await prisma.penyewaan.findMany({
            include: {
                penyewaan_detail: true,
                pelanggan: true
            },
            take: 10,
            skip: parseInt(req.query.page as string) * 10 || 0
        });

        const totalRentals = await prisma.penyewaan.count();

        return res.status(200).json({
            success: true,
            message: "Success mendpatkan semua penyewaan",
            data: rentals,
            pagination: {
                totalItem: rentals.length,
                totalData: totalRentals,
                totalPage: Math.floor(totalRentals / rentals.length)
            }
        });
    } catch (err) {
        logger.error("Error during fetching all rentals" + err);
        throw err;
    }
};

const selected = async (req: Request, res: Response) => {
    const { rentalId } = req.params;

    try {
        const resultNumberParams = checkNaN({ rentalId });

        const rental = await prisma.penyewaan.findUnique({
            where: {
                penyewaan_id: resultNumberParams.rentalId
            },
            include: {
                penyewaan_detail: {
                    include: {
                        alat: {
                            include: {
                                kategori: true
                            }
                        }
                    }
                },
                pelanggan: {
                    include: {
                        pelanggan_data: true
                    }
                }
            }
        });

        if (!rental) throw new errorAPI("Penyewaan tidak ditemukan", 404);

        return res.status(200).json({
            success: true,
            message: "Success mendapatkan penyewaan",
            data: rental
        });
    } catch (err) {
        logger.error("Error during fetching selected rental" + err);
        throw err;
    }
};

const create = async (req: Request, res: Response) => {
    const { daftar_alat, penyewaan_pelanggan_id, penyewaan_tglkembali, ...rentalData } = req.body;
    const rentalDate = dayjs().toISOString();
    const rentalReturnDate = dayjs(penyewaan_tglkembali).toISOString();

    try {
        const resultNumberParams = checkNaN({ penyewaan_pelanggan_id });

        const result = await prisma.$transaction(async (tx) => {
            const newRental = await tx.penyewaan.create({
                data: {
                    penyewaan_tglsewa: rentalDate,
                    penyewaan_totalharga: 0,
                    penyewaan_tglkembali: rentalReturnDate,
                    ...resultNumberParams,
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

            const rentalDetail = await Promise.all(
                daftar_alat.map(async (item) => {
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
                })
            );

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
            message: "Success membuat penyewaan baru",
            data: result
        });
    } catch (err) {
        logger.error("Error during creating newRental: " + err);

        if (err instanceof Prisma.PrismaClientKnownRequestError) {
            if (err.code === "P2025") {
                throw new errorAPI("Alat ada yang tidak ditemukan", 404);
            }
        }

        throw err;
    }
};

const update = async (req: Request, res: Response) => {
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

            if (!existingRental) throw new errorAPI("Penyewaan tidak ditemukan", 404);

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

                const rentalDetail = await Promise.all(
                    daftar_alat.map(async (item) => {
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
                    })
                );

                await tx.penyewaan_detail.createMany({ data: rentalDetail });
            } else {
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
    } catch (err) {
        logger.error("Error during updating rental: " + err);

        if (err instanceof Prisma.PrismaClientKnownRequestError) {
            if (err.code === "P2025") {
                throw new errorAPI("Alat ada yang tidak ditemukan", 404);
            }
        }

        throw err;
    }
};

const destroy = async (req: Request, res: Response) => {
    const { rentalId } = req.params;
    try {
        const resultNumberParams = checkNaN({ rentalId });

        await prisma.$transaction(async (tx) => {
            const rentalDetails = await tx.penyewaan_detail.findMany({
                where: { penyewaan_detail_penyewaan_id: resultNumberParams.rentalId }
            });

            rentalDetails.forEach(async (item) => {
                await tx.alat.update({
                    where: { alat_id: item.penyewaan_detail_alat_id },
                    data: { alat_stok: { increment: item.penyewaan_detail_jumlah } }
                });
            });

            await tx.penyewaan_detail.deleteMany({
                where: { penyewaan_detail_penyewaan_id: resultNumberParams.rentalId }
            });

            await tx.penyewaan.delete({
                where: {
                    penyewaan_id: resultNumberParams.rentalId
                }
            });
        });

        return res.status(204).send();
    } catch (err) {
        logger.error("Error during deleting alat: " + err);
        throw err;
    }
};

const destroyNotRestoreToolsStock = async (req: Request, res: Response) => {
    const { rentalId } = req.params;
    try {
        const resultNumberParams = checkNaN({ rentalId });

        await prisma.penyewaan.delete({
            where: {
                penyewaan_id: resultNumberParams.rentalId
            }
        });

        return res.status(204).send();
    } catch (err) {
        logger.error("Error during deleting alat: " + err);
        throw err;
    }
};

export default { index, selected, create, update, destroy, destroyNotRestoreToolsStock };
