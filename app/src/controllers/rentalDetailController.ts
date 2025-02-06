import { Request, Response } from "express";
import { logger } from "../utils/logger";
import errorAPI from "../utils/errorAPI";
import { checkNaN } from "../utils/checkNaN";
import prisma from "../database/prisma";
import { Prisma } from "@prisma/client";

const index = async (req: Request, res: Response) => {
    try {
        const rentalDetails = await prisma.penyewaan_detail.findMany({
            take: 10,
            skip: parseInt(req.query.page as string) * 10 || 0
        });

        const totalAllDetails = await prisma.penyewaan_detail.count();

        return res.status(200).json({
            success: true,
            message: "Success mendapatkan semua penyewaan detail",
            data: rentalDetails,
            pagination: {
                totalItem: rentalDetails.length,
                totalData: totalAllDetails,
                totalPage: Math.ceil(totalAllDetails / 10)
            }
        });
    } catch (err) {
        logger.error("Error during fetching all penyewaan details" + err);
        throw err;
    }
};

const selected = async (req: Request, res: Response) => {
    const { detailId } = req.params;
    try {
        const resultNumberParams = checkNaN({ detailId });

        const detail = await prisma.penyewaan_detail.findUnique({
            where: { penyewaan_detail_id: resultNumberParams.detailId },
            include: { penyewaan: true, alat: { include: { kategori: true } } }
        });

        if (!detail) throw new errorAPI("Penyewaan detail not found", 404);

        return res.status(200).json({
            success: true,
            message: "Success mendapatkan penyewaan detail",
            data: detail
        });
    } catch (err) {
        logger.error("Error during fetching selected penyewaan detail" + err);
        throw err;
    }
};

const create = async (req: Request, res: Response) => {
    const numberBodyValue = req.body;

    try {
        const { penyewaan_detail_penyewaan_id, penyewaan_detail_alat_id, penyewaan_detail_jumlah, penyewaan_detail_subharga } = checkNaN({
            ...numberBodyValue
        });
        const detail = await prisma.penyewaan_detail.create({
            data: {
                penyewaan_detail_penyewaan_id,
                penyewaan_detail_alat_id,
                penyewaan_detail_jumlah,
                penyewaan_detail_subharga
            }
        });

        return res.status(201).json({
            success: true,
            message: "Success membuat penyewaan detail baru",
            data: detail
        });
    } catch (err) {
        logger.error("Error during creating penyewaan detail" + err);
        throw err;
    }
};

const update = async (req: Request, res: Response) => {
    const { detailId } = req.params;
    const numberBodyValue = req.body;

    try {
        const resultNumberParams = checkNaN({ detailId });
        const { penyewaan_detail_penyewaan_id, penyewaan_detail_alat_id, penyewaan_detail_jumlah, penyewaan_detail_subharga } = checkNaN({
            ...numberBodyValue
        });

        const detail = await prisma.penyewaan_detail.update({
            data: {
                penyewaan_detail_penyewaan_id: penyewaan_detail_penyewaan_id,
                penyewaan_detail_alat_id: penyewaan_detail_alat_id,
                penyewaan_detail_jumlah: penyewaan_detail_jumlah,
                penyewaan_detail_subharga: penyewaan_detail_subharga
            },
            where: { penyewaan_detail_id: resultNumberParams.detailId }
        });

        return res.status(200).json({
            success: true,
            message: "Success mengupdate penyewaan detail",
            data: detail
        });
    } catch (err) {
        logger.error("Error during updating penyewaan detail" + err);

        if (err instanceof Prisma.PrismaClientKnownRequestError) {
            if (err.code === "P2025") {
                throw new errorAPI("Penyewaan detail not found", 404);
            }
        }

        throw err;
    }
};

const destroy = async (req: Request, res: Response) => {
    const { detailId } = req!.params;

    try {
        const resultNumberParams = checkNaN({ detailId });

        await prisma.$transaction(async (tx) => {
            const rentalDetails = await tx.penyewaan_detail.findUnique({
                where: { penyewaan_detail_id: resultNumberParams.detailId }
            });

            if (!rentalDetails) throw new errorAPI("Penyewaan detail tidak ditemukan", 404);

            await tx.alat.update({
                where: { alat_id: rentalDetails.penyewaan_detail_alat_id },
                data: { alat_stok: { increment: rentalDetails.penyewaan_detail_jumlah } }
            });

            await tx.penyewaan_detail.update({
                where: { penyewaan_detail_id: resultNumberParams.detailId },
                data: {
                    penyewaan: {
                        update: {
                            penyewaan_totalharga: { decrement: rentalDetails.penyewaan_detail_subharga }
                        }
                    }
                }
            });

            await tx.penyewaan_detail.delete({
                where: {
                    penyewaan_detail_id: resultNumberParams.detailId
                }
            });
        });

        return res.status(204).send();
    } catch (err) {
        logger.error("Error during deleting penyewaan detail" + err);
        throw err;
    }
};

const destroyNotRestoreToolsStock = async (req: Request, res: Response) => {
    const { detailId } = req!.params;

    try {
        const resultNumberParams = checkNaN({ detailId });

        await prisma.penyewaan_detail.delete({
            where: {
                penyewaan_detail_id: resultNumberParams.detailId
            }
        });

        return res.status(204).send();
    } catch (err) {
        logger.error("Error during deleting penyewaan detail" + err);
        throw err;
    }
};

export default { index, selected, create, update, destroy, destroyNotRestoreToolsStock };
