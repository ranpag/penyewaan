import prisma from "~/src/database/prisma";
import { logger } from "@utils/logger";
import errorAPI from "@utils/errorAPI";
import { checkNaN } from "@utils/checkNaN";
import { deleteFile } from "../services/fileService.js";
const index = async (req, res) => {
    try {
        const customerData = await prisma.pelanggan_data.findMany({
            take: 10,
            skip: typeof req.query.page === "string" ? Number(req.query.page) * 10 - 10 : 0
        });
        const totalCustomerData = await prisma.pelanggan_data.count();
        return res.status(200).json({
            success: true,
            message: "Success mendapatkan pelanggan data",
            data: customerData,
            pagination: {
                totalItem: customerData.length,
                totalData: totalCustomerData,
                totalPage: totalCustomerData > 10
                    ? Math.floor(totalCustomerData / customerData.length) + 1
                    : Math.floor(totalCustomerData / customerData.length)
            }
        });
    }
    catch (err) {
        logger.error("Error during fetching all customer data: " + err);
        throw err;
    }
};
const selected = async (req, res) => {
    const { customerDataId } = req.params;
    try {
        const resultNumber = checkNaN({ customerDataId });
        const exitingCustomerData = await prisma.pelanggan_data.findUnique({
            where: { pelanggan_data_id: resultNumber.customerDataId },
            include: { pelanggan: true }
        });
        if (!exitingCustomerData)
            throw new errorAPI("Customer data not found", 404);
        return res.status(200).json({
            success: true,
            message: "Successfully retrieved selected customer data",
            data: exitingCustomerData
        });
    }
    catch (err) {
        logger.error("Error during fetching selected customer data: " + err);
        throw err;
    }
};
const create = async (req, res) => {
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
    }
    catch (err) {
        logger.error("Error during creating customer data: " + err);
        throw err;
    }
};
const update = async (req, res) => {
    const { customerDataId } = req.params;
    try {
        const resultNumber = checkNaN({ customerDataId });
        const exitingCustomerData = await prisma.pelanggan_data.findUnique({
            where: { pelanggan_data_id: resultNumber.customerDataId }
        });
        if (!exitingCustomerData)
            throw new errorAPI("Customer data not found", 404);
        if (req.body.pelanggan_data_file && exitingCustomerData.pelanggan_data_file) {
            deleteFile("customerData", exitingCustomerData.pelanggan_data_file.split("/").at(-1) || "a.jpg");
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
    }
    catch (err) {
        logger.error("Error during updating customer data: " + err);
        throw err;
    }
};
const destroy = async (req, res) => {
    const { customerDataId } = req.params;
    try {
        const resultNumber = checkNaN({ customerDataId });
        const exitingCustomerData = await prisma.pelanggan_data.findUnique({
            where: {
                pelanggan_data_id: resultNumber.customerDataId
            }
        });
        if (!exitingCustomerData)
            throw new errorAPI("Customer data not found", 404);
        if (exitingCustomerData && exitingCustomerData.pelanggan_data_file) {
            deleteFile("customerData", exitingCustomerData.pelanggan_data_file.split("/").at(-1) || "");
        }
        await prisma.pelanggan_data.delete({
            where: {
                pelanggan_data_id: resultNumber.customerDataId
            }
        });
        return res.status(204).send();
    }
    catch (err) {
        logger.error("Error during deleting customer data: " + err);
        throw err;
    }
};
export default { index, selected, create, update, destroy };
