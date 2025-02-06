import prisma from "../../src/database/prisma.js";
import { logger } from "../utils/logger.js";
import errorAPI from "../utils/errorAPI.js";
const index = async (req, res) => {
    try {
        const tools = await prisma.alat.findMany({
            include: {
                kategori: true
            },
            take: 10,
            skip: parseInt(req.query.page) * 10 || 0
        });
        const totalTools = await prisma.alat.count();
        return res.status(200).json({
            success: true,
            message: "Successfully retrieved all tools",
            data: tools,
            pagination: {
                totalItem: tools.length,
                totalData: totalTools,
                totalPage: Math.floor(totalTools / tools.length)
            }
        });
    }
    catch (err) {
        logger.error("Error during fetching all alat: " + err);
        throw err;
    }
};
const selected = async (req, res) => {
    try {
        const tool = await prisma.alat.findUnique({
            where: {
                alat_id: parseInt(req.params.toolId)
            },
            include: {
                kategori: true
            }
        });
        if (!tool)
            throw new errorAPI("Tool not found", 404);
        return res.status(200).json({
            success: true,
            message: "Successfully retrieved selected tool",
            data: tool
        });
    }
    catch (err) {
        logger.error("Error during fetching selected tool: " + err);
        throw err;
    }
};
const create = async (req, res) => {
    try {
        const tool = await prisma.alat.create({
            data: {
                alat_nama: req.body.alat_nama,
                alat_deskripsi: req.body.alat_deskripsi,
                alat_hargaperhari: parseInt(req.body.alat_hargaperhari),
                alat_stok: parseInt(req.body.alat_stok),
                alat_kategori_id: parseInt(req.body.alat_kategori_id)
            }
        });
        return res.status(201).json({
            success: true,
            message: "Successfully created tool",
            data: tool
        });
    }
    catch (err) {
        logger.error("Error during creating tool: " + err);
        throw err;
    }
};
const update = async (req, res) => {
    const { alat_hargaperhari, alat_stok, alat_kategori_id, ...stringValue } = req.body;
    const intValue = {};
    if (!isNaN(parseInt(alat_hargaperhari)))
        intValue.alat_hargaperhari = parseInt(alat_hargaperhari);
    if (!isNaN(parseInt(alat_stok)))
        intValue.alat_stok = parseInt(alat_stok);
    if (!isNaN(parseInt(alat_kategori_id)))
        intValue.alat_kategori_id = parseInt(alat_kategori_id);
    try {
        const tool = await prisma.alat.update({
            data: {
                ...stringValue,
                ...intValue
            },
            where: {
                alat_id: parseInt(req.params.toolId)
            }
        });
        if (!tool)
            throw new errorAPI("Tool not found", 404);
        return res.status(200).json({
            success: true,
            message: "Successfully updated tool",
            data: tool
        });
    }
    catch (err) {
        logger.error("Error during updating tool: " + err);
        throw err;
    }
};
const destroy = async (req, res) => {
    try {
        await prisma.alat.delete({
            where: {
                alat_id: parseInt(req.params.toolId)
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
