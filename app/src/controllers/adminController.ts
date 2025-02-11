import { Request, Response } from "express";
import prisma from "~/src/database/prisma";
import { logger } from "@utils/logger";
import { checkNaN } from "../utils/checkNaN";
import errorAPI from "../utils/errorAPI";
import bcrypt from "bcrypt";

const index = async (req: Request, res: Response) => {
    const { page, search } = req.query;
    const limit = 25;
    const keywords = Array.isArray(search)
        ? search.map((item) => (typeof item === "string" ? item : undefined)).filter((e) => String(e).trim())
        : typeof search === "string"
          ? [search]
          : undefined;

    try {
        const categories = await prisma.admin.findMany({
            where: {
                OR: keywords?.map((keyword) => ({ admin_username: { contains: keyword, mode: "insensitive" } }))
            },
            omit: {
                admin_password: true
            },
            take: limit,
            skip: typeof page === "string" ? Number(page) * limit - limit : 0
        });

        const totalAllAdmin = await prisma.admin.count({
            where: {
                OR: keywords?.map((keyword) => ({ admin_username: { contains: keyword, mode: "insensitive" } }))
            }
        });

        return res.status(200).json({
            success: true,
            message: "Success mendapatkan semua admin",
            data: categories,
            pagination: {
                item: categories.length,
                matchData: totalAllAdmin,
                allPage: Math.ceil(totalAllAdmin / limit),
                currentPage: Number(page) || 1
            }
        });
    } catch (err) {
        logger.error("Error during fetching all admin" + err);
        throw err;
    }
};

const destroy = async (req: Request, res: Response) => {
    const { adminId } = req.params;
    const { your_password } = req.body;

    try {
        const resultNumberParams = checkNaN({ adminId });

        const admin = await prisma.admin.findUnique({
            where: { admin_id: req.user?.admin_id }
        })

        if (!admin) throw new errorAPI("Forbidden", 403, ["You can access this resources"]);

        console.log(admin)

        const isPasswordValid = await bcrypt.compare(your_password, admin?.admin_password);
        if (!isPasswordValid) throw new errorAPI("Unauthorized", 401, ["Invalid credentials"]);

        await prisma.admin.delete({
            where: {
                admin_id: resultNumberParams.adminId
            }
        });

        return res.status(204).send();
    } catch (err) {
        logger.error("Error during deleting admin" + err);
        throw err;
    }
};

export default { index, destroy };

