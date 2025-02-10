import { Request, Response } from "express";
import prisma from "~/src/database/prisma";
import { logger } from "@utils/logger";
import { errorAPI } from "../utils/errorAPI";
import { checkNaN } from "../utils/checkNaN";
import { Prisma } from "@prisma/client";

const index = async (req: Request, res: Response) => {
    try {
        const categories = await prisma.kategori.findMany({
            include: { _count: true },
            take: 10,
            skip: typeof req.query.page === "string" ? Number(req.query.page) * 10 - 10 : 0
        });

        const totalAllCategories = await prisma.kategori.count();

        return res.status(200).json({
            success: true,
            message: "Success mendapatkan semua kategori",
            data: categories,
            pagination: {
                totalItem: categories.length,
                totalData: totalAllCategories,
                totalPage:
                    totalAllCategories > 10
                        ? Math.floor(totalAllCategories / categories.length) + 1
                        : Math.floor(totalAllCategories / categories.length)
            }
        });
    } catch (err) {
        logger.error("Error during fetching all categories" + err);
        throw err;
    }
};

const selected = async (req: Request, res: Response) => {
    const { categoryId } = req.params;

    try {
        const resultNumberParams = checkNaN({ categoryId });

        const category = await prisma.kategori.findUnique({
            where: {
                kategori_id: resultNumberParams.categoryId
            },
            include: { _count: true }
        });

        if (!category) throw new errorAPI("Kategori tidak ditemukan", 404);

        return res.status(200).json({
            success: true,
            message: "Success mendapatkan kategori",
            data: category
        });
    } catch (err) {
        logger.error("Error during fetching selected category" + err);
        throw err;
    }
};

const create = async (req: Request, res: Response) => {
    try {
        const category = await prisma.kategori.create({
            data: { kategori_nama: req.body.kategori_nama },
            include: { _count: true }
        });

        return res.status(201).json({
            success: true,
            message: "Success membuat kategori baru",
            data: category
        });
    } catch (err) {
        logger.error("Error during creating category" + err);
        throw err;
    }
};

const update = async (req: Request, res: Response) => {
    const { categoryId } = req.params;

    try {
        const resultNumberParams = checkNaN({ categoryId });

        const category = await prisma.kategori.update({
            data: { kategori_nama: req.body.kategori_nama },
            where: { kategori_id: resultNumberParams.categoryId },
            include: { _count: true }
        });

        return res.status(200).json({
            success: true,
            message: "Success mengupdate kategori",
            data: category
        });
    } catch (err) {
        logger.error("Error during updating category" + err);

        if (err instanceof Prisma.PrismaClientKnownRequestError) {
            if (err.code === "P2025") {
                throw new errorAPI("Kategori not found", 404);
            }
        }

        throw err;
    }
};

const destroy = async (req: Request, res: Response) => {
    const { categoryId } = req.params;

    try {
        const resultNumberParams = checkNaN({ categoryId });

        await prisma.kategori.delete({
            where: {
                kategori_id: resultNumberParams.categoryId
            }
        });

        return res.status(204).send();
    } catch (err) {
        logger.error("Error during deleting category" + err);
        throw err;
    }
};

export default { index, selected, create, update, destroy };
