import prisma from "../../src/database/prisma.js";
import { logger } from "../utils/logger.js";
import errorAPI from "../utils/errorAPI.js";
const index = async (req, res) => {
    try {
        const categories = await prisma.kategori.findMany({
            take: 10,
            skip: parseInt(req.query.page) * 10 || 0
        });
        const totalCategories = await prisma.kategori.count();
        return res.status(200).json({
            success: true,
            message: "Succesfull retreived all categories",
            data: categories,
            pagination: {
                totalItem: categories.length,
                totalData: totalCategories,
                totalPage: Math.floor(totalCategories / categories.length)
            }
        });
    }
    catch (err) {
        logger.error("Error during fetching all categories" + err);
        throw err;
    }
};
const selected = async (req, res) => {
    try {
        const category = await prisma.kategori.findUnique({
            where: {
                kategori_id: parseInt(req.params.categoryId)
            }
        });
        if (!category)
            throw new errorAPI("Category not found", 404);
        return res.status(200).json({
            success: true,
            message: "Succesfull retreived selected category",
            data: category
        });
    }
    catch (err) {
        logger.error("Error during fetching selected category" + err);
        throw err;
    }
};
const create = async (req, res) => {
    try {
        const category = await prisma.kategori.create({
            data: { ...req.body }
        });
        return res.status(201).json({
            success: true,
            message: "Succesfull created category",
            data: category
        });
    }
    catch (err) {
        logger.error("Error during creating category" + err);
        throw err;
    }
};
const update = async (req, res) => {
    try {
        const category = await prisma.kategori.update({
            data: { ...req.body },
            where: {
                kategori_id: parseInt(req.params.categoryId)
            }
        });
        if (!category)
            throw new errorAPI("Category not found", 404);
        return res.status(200).json({
            success: true,
            message: "Succesfull updated category",
            data: category
        });
    }
    catch (err) {
        logger.error("Error during updating category" + err);
        throw err;
    }
};
const destroy = async (req, res) => {
    try {
        await prisma.kategori.delete({
            where: {
                kategori_id: parseInt(req.params.categoryId)
            }
        });
        return res.status(204);
    }
    catch (err) {
        logger.error("Error during deleting category" + err);
        throw err;
    }
};
export default { index, selected, create, update, destroy };
