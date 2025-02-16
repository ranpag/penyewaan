import { Request, Response } from "express";
import prisma from "~/src/database/prisma";
import { logger } from "@utils/logger";
import errorAPI from "@utils/errorAPI";
import { checkNaN } from "@utils/checkNaN";
import { deleteFile } from "../services/fileService";

const index = async (req: Request, res: Response) => {
    const { page, search, pelanggan_id } = req.query;
    const limit = 25;
    const keywords = Array.isArray(search)
        ? search.map((item) => (typeof item === "string" ? item : undefined)).filter((e) => String(e).trim())
        : typeof search === "string"
          ? [search]
          : undefined;

    try {
        const resultNumberParams = checkNaN({ pelanggan_id });
        const customerData = await prisma.pelanggan_data.findMany({
            where: {
                OR: resultNumberParams.pelanggan_id
                    ? [{ pelanggan_data_pelanggan_id: resultNumberParams.pelanggan_id }]
                    : keywords?.flatMap((keyword) => [
                          { pelanggan: { pelanggan_nama: { contains: keyword, mode: "insensitive" } } },
                          { pelanggan: { pelanggan_email: { contains: keyword, mode: "insensitive" } } }
                      ])
            },
            take: limit,
            skip: typeof page === "string" ? Number(page) * limit - limit : 0
        });

        const totalCustomerData = await prisma.pelanggan_data.count({
            where: {
                OR: keywords?.flatMap((keyword) => [
                    { pelanggan: { pelanggan_nama: { contains: keyword, mode: "insensitive" } } },
                    { pelanggan: { pelanggan_email: { contains: keyword, mode: "insensitive" } } }
                ])
            }
        });

        return res.status(200).json({
            success: true,
            message: "Success mendapatkan pelanggan data",
            data: customerData,
            pagination: {
                item: customerData.length,
                matchData: totalCustomerData,
                allPage: Math.ceil(totalCustomerData / limit),
                currentPage: Number(page) || 1
            }
        });
    } catch (err) {
        logger.error("Error during fetching all customer data: " + err);
        throw err;
    }
};

const selected = async (req: Request, res: Response) => {
    const { customerDataId } = req.params;
    try {
        const resultNumber = checkNaN({ customerDataId });
        const exitingCustomerData = await prisma.pelanggan_data.findUnique({
            where: { pelanggan_data_id: resultNumber.customerDataId },
            include: { pelanggan: true }
        });

        if (!exitingCustomerData) throw new errorAPI("Customer data not found", 404);

        return res.status(200).json({
            success: true,
            message: "Successfully retrieved selected customer data",
            data: exitingCustomerData
        });
    } catch (err) {
        logger.error("Error during fetching selected customer data: " + err);
        throw err;
    }
};

const create = async (req: Request, res: Response) => {
    const { pelanggan_data_pelanggan_id, ...customerDataBody } = req.body;
    try {
        const resultNumber = checkNaN({ pelanggan_data_pelanggan_id });
        const newCustomerData = await prisma.pelanggan_data.create({
            data: {
                pelanggan_data_pelanggan_id: resultNumber.pelanggan_data_pelanggan_id,
                ...customerDataBody
            }
        });

        return res.status(201).json({
            success: true,
            message: "Successfully created customer data",
            data: newCustomerData
        });
    } catch (err) {
        logger.error("Error during creating customer data: " + err);
        throw err;
    }
};

const update = async (req: Request, res: Response) => {
    const { customerDataId } = req.params;
    try {
        const resultNumber = checkNaN({ customerDataId });

        const exitingCustomerData = await prisma.pelanggan_data.findUnique({
            where: { pelanggan_data_id: resultNumber.customerDataId }
        });

        if (!exitingCustomerData) throw new errorAPI("Customer data not found", 404);

        if (req.body.pelanggan_data_file && exitingCustomerData.pelanggan_data_file) {
            try {
                await deleteFile("customerData", exitingCustomerData.pelanggan_data_file.split("/").at(-1) || "");
            } catch (error) {
                logger.error("Error during deleting images: " + error);
            }
        }

        const updatedCustomerData = await prisma.pelanggan_data.update({
            data: { ...req.body },
            where: { pelanggan_data_id: exitingCustomerData.pelanggan_data_id }
        });

        return res.status(200).json({
            success: true,
            message: "Successfully updated customer data",
            data: updatedCustomerData
        });
    } catch (err) {
        logger.error("Error during updating customer data: " + err);
        throw err;
    }
};

const destroy = async (req: Request, res: Response) => {
    const { customerDataId } = req.params;
    try {
        const resultNumber = checkNaN({ customerDataId });
        const exitingCustomerData = await prisma.pelanggan_data.findUnique({
            where: {
                pelanggan_data_id: resultNumber.customerDataId
            }
        });

        if (!exitingCustomerData) throw new errorAPI("Customer data not found", 404);

        if (exitingCustomerData && exitingCustomerData.pelanggan_data_file) {
            try {
                await deleteFile("customerData", exitingCustomerData.pelanggan_data_file.split("/").at(-1) || "");
            } catch (error) {
                logger.error("Error during deleting images: " + error);
            }
        }

        await prisma.pelanggan_data.delete({
            where: {
                pelanggan_data_id: resultNumber.customerDataId
            }
        });

        return res.status(204).send();
    } catch (err) {
        logger.error("Error during deleting customer data: " + err);
        throw err;
    }
};

export default { index, selected, create, update, destroy };
