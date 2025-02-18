import { Request, Response } from "express";
import { logger } from "../utils/logger";
import errorAPI from "../utils/errorAPI";
import { checkNaN } from "../utils/checkNaN";
import prisma from "../database/prisma";
import { Prisma } from "@prisma/client";
import dayjs from "dayjs";

const index = async (req: Request, res: Response) => {
    const { page, penyewaan_id } = req.query;
    const limit = 25;

    try {
        const resultNumberParams = checkNaN({ penyewaan_id });
        const rentalDetails = await prisma.penyewaan_detail.findMany({
            where: {
                penyewaan_detail_penyewaan_id: resultNumberParams.penyewaan_id
            },
            include: {
                alat: {
                    select: {
                        alat_id: true,
                        alat_nama: true,
                        alat_hargaperhari: true,
                        kategori: true
                    }
                }
            },
            take: limit,
            skip: typeof page === "string" ? Number(page) * limit - limit : 0
        });

        const totalAllDetails = await prisma.penyewaan_detail.count({
            where: {
                penyewaan_detail_penyewaan_id: resultNumberParams.penyewaan_id
            }
        });

        return res.status(200).json({
            success: true,
            message: "Success mendapatkan semua penyewaan detail",
            data: rentalDetails,
            pagination: {
                item: rentalDetails.length,
                matchData: totalAllDetails,
                allPage: Math.ceil(totalAllDetails / limit),
                currentPage: Number(page) || 1
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
            include: {
                penyewaan: {
                    include: {
                        pelanggan: {
                            select: {
                                pelanggan_id: true,
                                pelanggan_nama: true
                            }
                        },
                        _count: true
                    }
                },
                alat: {
                    include: {
                        kategori: {
                            include: {
                                _count: true
                            }
                        }
                    }
                }
            }
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
        const { penyewaan_detail_penyewaan_id, penyewaan_detail_alat_id, penyewaan_detail_jumlah } = checkNaN({
            ...numberBodyValue
        });

        const result = await prisma.$transaction(async (tx) => {
            const rental = await tx.penyewaan.findUnique({
                where: { penyewaan_id: penyewaan_detail_penyewaan_id }
            });

            const tool = await tx.alat.findUnique({
                where: { alat_id: penyewaan_detail_alat_id }
            });

            if (!tool) {
                throw new errorAPI("Not Found", 404, { penyewaan_detail_alat_id: ["Alat tidak ditemukan"] });
            }

            const rentalDate = dayjs(rental?.penyewaan_tglsewa).toISOString();
            const rentalReturnDate = dayjs(rental?.penyewaan_tglkembali).toISOString();
            const diffInDays = dayjs(rentalReturnDate).diff(dayjs(rentalDate), "day");

            const detail = await tx.penyewaan_detail.create({
                data: {
                    penyewaan_detail_penyewaan_id,
                    penyewaan_detail_alat_id,
                    penyewaan_detail_jumlah,
                    penyewaan_detail_subharga: penyewaan_detail_jumlah * tool.alat_hargaperhari! * diffInDays
                },
                include: {
                    alat: {
                        select: {
                            alat_id: true,
                            alat_nama: true,
                            alat_hargaperhari: true,
                            kategori: true
                        }
                    }
                }
            });

            await tx.alat.update({
                where: { alat_id: tool.alat_id },
                data: { alat_stok: { decrement: penyewaan_detail_jumlah } }
            });

            await tx.penyewaan.update({
                where: { penyewaan_id: penyewaan_detail_penyewaan_id },
                data: { penyewaan_totalharga: { increment: detail.penyewaan_detail_subharga } }
            });

            return detail
        })

        return res.status(201).json({
            success: true,
            message: "Success membuat penyewaan detail baru",
            data: result
        });
    } catch (err) {
        logger.error("Error during creating penyewaan detail" + err);
        throw err;
    }
};

const update = async (req: Request, res: Response) => {
    const { detailId } = req.params;
    const { penyewaan_detail_penyewaan_id, penyewaan_detail_alat_id, penyewaan_detail_jumlah } = req.body;

    try {
        const resultNumberParams = checkNaN({ detailId });
        const resultNumberBody = checkNaN({
            penyewaan_detail_penyewaan_id,
            penyewaan_detail_alat_id,
            penyewaan_detail_jumlah
        });

        const detail = await prisma.$transaction(async (tx) => {
            const rentalDetails = await tx.penyewaan_detail.findUnique({
                where: { penyewaan_detail_id: resultNumberParams.detailId },
                include: { penyewaan: true }
            });

            if (!rentalDetails) throw new errorAPI("Penyewaan detail tidak ditemukan", 404);

            await tx.alat.update({
                where: { alat_id: rentalDetails.penyewaan_detail_alat_id },
                data: { alat_stok: { increment: rentalDetails.penyewaan_detail_jumlah } }
            });

            const stockReductionTool = await tx.alat.update({
                where: { alat_id: resultNumberBody.penyewaan_detail_alat_id || rentalDetails.penyewaan_detail_alat_id },
                data: { alat_stok: { decrement: resultNumberBody.penyewaan_detail_jumlah || rentalDetails.penyewaan_detail_jumlah } }
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

            const rentalDate = dayjs(rentalDetails?.penyewaan.penyewaan_tglsewa).toISOString();
            const rentalReturnDate = dayjs(rentalDetails?.penyewaan.penyewaan_tglkembali).toISOString();
            const diffInDays = dayjs(rentalReturnDate).diff(dayjs(rentalDate), "day");

            const updatedRentalDetail = await tx.penyewaan_detail.update({
                where: {
                    penyewaan_detail_id: resultNumberParams.detailId
                },
                data: {
                    ...resultNumberBody,
                    penyewaan_detail_subharga:
                        stockReductionTool.alat_hargaperhari *
                        (resultNumberBody.penyewaan_detail_jumlah || rentalDetails.penyewaan_detail_jumlah) *
                        diffInDays
                }
            });

            return await tx.penyewaan_detail.update({
                where: { penyewaan_detail_id: resultNumberParams.detailId },
                data: {
                    penyewaan: {
                        update: {
                            penyewaan_totalharga: { increment: updatedRentalDetail.penyewaan_detail_subharga }
                        }
                    }
                },
                include: {
                    alat: {
                        select: {
                            alat_id: true,
                            alat_nama: true,
                            alat_hargaperhari: true,
                            kategori: true
                        }
                    }
                }
            });
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

        const rentalDetail = await prisma.penyewaan_detail.findUnique({
            where: { penyewaan_detail_id: resultNumberParams.detailId }
        });

        if (!rentalDetail) {
            throw new errorAPI("Penyewaan detail tidak ditemukan", 404);
        }

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
