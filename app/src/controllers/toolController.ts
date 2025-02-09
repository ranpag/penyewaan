import { Request, Response } from "express";
import prisma from "~/src/database/prisma";
import { logger } from "@utils/logger";
import errorAPI from "@utils/errorAPI";
import { checkNaN } from "../utils/checkNaN";
import { Prisma } from "@prisma/client";

const index = async (req: Request, res: Response) => {
    try {
        const tools = await prisma.alat.findMany({
            include: {
                kategori: {
                    include: { _count: true }
                },
                _count: true
            },
            take: 10,
            skip: typeof req.query.page === "string" ? Number(req.query.page) * 10 - 10 : 0
        });

        const totalAllTools = await prisma.alat.count();

        const newTools = tools.map((tool) => {
            return {
                ...tool,
                _count: {
                    total_disewa: tool._count.penyewaan_detail
                }
            };
        });

        return res.status(200).json({
            success: true,
            message: "Success mendapatkan semua alat",
            data: newTools,
            pagination: {
                totalItem: tools.length,
                totalAllData: totalAllTools,
                totalPage: totalAllTools > 10 ? Math.floor(totalAllTools / tools.length) + 1 : Math.floor(totalAllTools / tools.length)
            }
        });
    } catch (err) {
        logger.error("Error during fetching all alat: " + err);
        throw err;
    }
};

const selected = async (req: Request, res: Response) => {
    const { toolId } = req.params;

    try {
        const resultNumberParams = checkNaN({ toolId });
        const tool = await prisma.alat.findUnique({
            where: { alat_id: resultNumberParams.toolId },
            include: {
                kategori: {
                    include: { _count: true }
                },
                _count: true
            }
        });

        if (!tool) throw new errorAPI("Alat not found", 404);

        const newTool = {
            ...tool,
            _count: {
                total_disewa: tool._count.penyewaan_detail
            }
        };

        return res.status(200).json({
            success: true,
            message: "Success mendapatkan alat",
            data: newTool
        });
    } catch (err) {
        logger.error("Error during fetching selected tool: " + err);
        throw err;
    }
};

const create = async (req: Request, res: Response) => {
    const { alat_hargaperhari, alat_stok, alat_kategori_id } = req.body;

    try {
        const resultNumberBody = checkNaN({ alat_hargaperhari, alat_stok, alat_kategori_id });
        const tool = await prisma.alat.create({
            data: {
                alat_nama: req.body.alat_nama,
                alat_deskripsi: req.body.alat_deskripsi,
                alat_hargaperhari: resultNumberBody.alat_hargaperhari,
                alat_stok: resultNumberBody.alat_stok,
                alat_kategori_id: resultNumberBody.alat_kategori_id
            },
            include: {
                kategori: {
                    include: { _count: true }
                },
                _count: true
            }
        });

        const newTool = {
            ...tool,
            _count: {
                total_disewa: tool._count.penyewaan_detail
            }
        };

        return res.status(201).json({
            success: true,
            message: "Success membuat alat baru",
            data: newTool
        });
    } catch (err) {
        logger.error("Error during creating tool: " + err);
        throw err;
    }
};

const update = async (req: Request, res: Response) => {
    const { alat_hargaperhari, alat_stok, alat_kategori_id, ...stringValue } = req.body;
    const { toolId } = req.params;

    try {
        const resultNumberBody = checkNaN({ alat_hargaperhari, alat_stok, alat_kategori_id });
        const resultNumberParams = checkNaN({ toolId });

        const tool = await prisma.alat.update({
            data: {
                ...stringValue,
                ...resultNumberBody
            },
            where: { alat_id: resultNumberParams.toolId },
            include: {
                kategori: {
                    include: { _count: true }
                },
                _count: true
            }
        });

        const newTool = {
            ...tool,
            _count: {
                total_disewa: tool._count.penyewaan_detail
            }
        };

        return res.status(200).json({
            success: true,
            message: "Success mengupdate alat",
            data: newTool
        });
    } catch (err) {
        logger.error("Error during updating alat: " + err);

        if (err instanceof Prisma.PrismaClientKnownRequestError) {
            if (err.code === "P2025") {
                throw new errorAPI("Alat tidak ditemukan", 404);
            }
        }

        throw err;
    }
};

const destroy = async (req: Request, res: Response) => {
    const { toolId } = req.params;

    try {
        const resultNumberParams = checkNaN({ toolId });

        await prisma.alat.delete({
            where: {
                alat_id: resultNumberParams.toolId
            }
        });

        return res.status(204).send();
    } catch (err) {
        logger.error("Error during deleting alat: " + err);
        throw err;
    }
};

export default { index, selected, create, update, destroy };
