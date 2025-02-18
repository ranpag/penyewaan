import { Request, Response } from "express";
import prisma from "~/src/database/prisma";
import { logger } from "@utils/logger";
import errorAPI from "@utils/errorAPI";
import { checkNaN } from "../utils/checkNaN";
import { Prisma } from "@prisma/client";
import { deleteFile } from "../services/fileService";

const index = async (req: Request, res: Response) => {
    const { page, search, min_harga, max_harga, min_stok, max_stok, kategori_id } = req.query;
    const limit = 25;
    const keywords = Array.isArray(search)
        ? search.map((item) => (typeof item === "string" ? item : undefined)).filter((e) => String(e).trim())
        : typeof search === "string"
          ? [search]
          : undefined;

    try {
        const resultNumberQuery = checkNaN({ min_harga, max_harga, min_stok, max_stok, kategori_id });
        const whereClause: Prisma.alatWhereInput = {
            ...(keywords
                ? {
                      OR: keywords?.flatMap((keyword) => [
                          { alat_nama: { contains: keyword as string, mode: "insensitive" } },
                          { kategori: { kategori_nama: { contains: keyword as string, mode: "insensitive" } } }
                      ])
                  }
                : {}),
            ...(resultNumberQuery.min_harga ? { alat_hargaperhari: { gte: Number(min_harga) } } : {}),
            ...(resultNumberQuery.max_harga ? { alat_hargaperhari: { lte: Number(max_harga) } } : {}),
            ...(resultNumberQuery.min_stok ? { alat_stok: { gte: Number(min_stok) } } : {}),
            ...(resultNumberQuery.max_stok ? { alat_stok: { lte: Number(max_stok) } } : {}),
            ...(resultNumberQuery.kategori_id ? { alat_kategori_id: { lte: Number(kategori_id) } } : {})
        };

        const tools = await prisma.alat.findMany({
            where: whereClause,
            include: {
                kategori: {
                    include: { _count: true }
                },
                _count: true
            },
            take: limit,
            skip: typeof page === "string" ? Number(page) * limit - limit : 0
        });

        const totalAllTools = await prisma.alat.count({
            where: whereClause
        });

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
                item: tools.length,
                matchData: totalAllTools,
                allPage: Math.ceil(totalAllTools / limit),
                currentPage: Number(page) || 1
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
                alat_gambar: {
                    include: {
                        gambar: true
                    }
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

        const alat = await prisma.alat.findUnique({
            where: { alat_id: resultNumberParams.toolId },
            select: {
                alat_id: true,
                gambar_utama: true,
                alat_gambar: {
                    select: {
                        gambar: {
                            select: { gambar: true,  gambar_id: true } 
                        }
                    }
                }
            }
        });


        if (!alat) {
            return res.status(404).json({ message: "Alat tidak ditemukan" });
        }

        const deletePromises = alat.alat_gambar.map((img) => deleteFile("alat", img.gambar.gambar.split("/").at(-1) || ""));

        if (alat.gambar_utama) {
            deletePromises.push(deleteFile("alat", alat.gambar_utama.split("/").at(-1) || ""));
        }

        await Promise.all(deletePromises);

        await prisma.$transaction([
            prisma.gambar.deleteMany({ where: { gambar_id: { in: alat.alat_gambar.map((img) => img.gambar.gambar_id) } } }),
            prisma.alat.delete({ where: { alat_id: resultNumberParams.toolId } })
        ]);

        return res.status(204).send();
    } catch (err) {
        logger.error("Error during deleting alat: " + err);
        throw err;
    }
};

const saveUploadFile = async (req: Request, res: Response) => {
    const { toolId } = req.params;

    try {
        const resultNumberParams = checkNaN({ toolId });

        await prisma.$transaction(async (tx) => {
            if (req.body.gambar_utama) {
                const alat = await prisma.alat.findUnique({
                    where: {
                        alat_id: resultNumberParams.toolId
                    }
                });

                if (alat && alat.gambar_utama) {
                    try {
                        await deleteFile("alat", alat.gambar_utama.split("/").at(-1) || "");
                    } catch (error) {
                        logger.error("Error during deleting images: " + error);
                    }
                }

                await tx.alat.update({
                    where: { alat_id: resultNumberParams.toolId },
                    data: { gambar_utama: req.body.gambar_utama[0] }
                });
            }

            if(req.body.gambar) {
                await tx.gambar.createMany({
                    data: req.body.gambar.map((link: string) => ({ gambar: link })),
                    skipDuplicates: true
                });

                const gambarList = await tx.gambar.findMany({
                    where: { gambar: { in: req.body.gambar } },
                    select: { gambar_id: true }
                });

                await tx.alat_gambar.createMany({
                    data: gambarList.map(({ gambar_id }) => ({
                        alat_id: resultNumberParams.toolId,
                        gambar_id
                    })),
                    skipDuplicates: true
                });
            }
        });

        return res.status(204).send();
    } catch (err) {
        logger.error("Error during saving images: " + err);
        throw err;
    }
};

const deleteGambar = async (req: Request, res: Response) => {
    const { gambarId } = req.params;

    try {
        const resultNumberParams = checkNaN({ gambarId });

        const gambar = await prisma.gambar.findUnique({
            where: { gambar_id: resultNumberParams.gambarId }
        });

        if (!gambar) {
            return res.status(404).json({
                success: false,
                message: "Gambar tidak ditemukan"
            });
        }

        try {
            await deleteFile("alat", gambar.gambar.split("/").at(-1) || "");
        } catch (error) {
            logger.error("Error deleting image from S3: " + error);
        }

        await prisma.$transaction([
            prisma.alat_gambar.deleteMany({
                where: { gambar_id: resultNumberParams.gambarId }
            }),
            prisma.gambar.delete({
                where: { gambar_id: resultNumberParams.gambarId }
            })
        ]);

        return res.status(204).send();
    } catch (err) {
        logger.error("Error deleting gambar: " + err);
        throw err;
    }
};


export default { index, selected, create, update, destroy, saveUploadFile, deleteGambar };
