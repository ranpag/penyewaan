import prisma from "../../src/database/prisma.js";
import { logger } from "../utils/logger.js";
import errorAPI from "../utils/errorAPI.js";
import { deleteFile } from "../services/fileService.js";
const index = async (req, res) => {
    try {
        const customers = await prisma.pelanggan.findMany({
            include: {
                pelanggan_data: true,
                penyewaan: true
            },
            take: 10,
            skip: parseInt(req.query.page) * 10 || 0
        });
        const totalCustomers = await prisma.pelanggan.count();
        return res.status(200).json({
            success: true,
            message: "Successfully retrieved all customers",
            data: customers,
            pagination: {
                totalItem: customers.length,
                totalData: totalCustomers,
                totalPage: Math.floor(totalCustomers / customers.length)
            }
        });
    }
    catch (err) {
        logger.error("Error during fetching all customers" + err);
        throw err;
    }
};
const selected = async (req, res) => {
    try {
        const customer = await prisma.pelanggan.findUnique({
            where: {
                pelanggan_id: parseInt(req.params.customerId)
            },
            include: {
                pelanggan_data: true,
                penyewaan: true
            }
        });
        if (!customer)
            throw new errorAPI("Customer not found", 404);
        return res.status(200).json({
            success: true,
            message: "Successfully retrieved selected customer",
            data: customer
        });
    }
    catch (err) {
        logger.error("Error during fetching customer by ID" + err);
        throw err;
    }
};
const create = async (req, res) => {
    const { pelanggan_data_jenis, pelanggan_data_file, ...onlyCustomer } = req.body;
    try {
        const customer = await prisma.pelanggan.create({
            data: onlyCustomer
        });
        if (pelanggan_data_jenis && pelanggan_data_file) {
            await prisma.pelanggan_data.create({
                data: {
                    pelanggan_data_pelanggan_id: customer.pelanggan_id,
                    pelanggan_data_jenis: pelanggan_data_jenis,
                    pelanggan_data_file: pelanggan_data_file
                }
            });
            const updatedCustomer = await prisma.pelanggan.findUnique({
                where: { pelanggan_id: customer.pelanggan_id },
                include: { pelanggan_data: true }
            });
            return res.status(201).json({
                success: true,
                statusCode: 201,
                message: "Successfully created new customer",
                data: updatedCustomer
            });
        }
        return res.status(201).json({
            success: true,
            statusCode: 201,
            message: "Successfully created new customer",
            data: customer
        });
    }
    catch (err) {
        logger.error("Error during creating new customer" + err);
        throw err;
    }
};
const update = async (req, res) => {
    const { pelanggan_data_jenis, pelanggan_data_file, ...onlyCustomer } = req.body;
    try {
        const customer = await prisma.pelanggan.update({
            data: onlyCustomer,
            where: { pelanggan_id: parseInt(req.params.customerId) },
            include: { pelanggan_data: true }
        });
        if (pelanggan_data_file && customer.pelanggan_data?.pelanggan_data_file) {
            deleteFile("customerData", customer.pelanggan_data.pelanggan_data_file.split("/").at(-1) || "a.jpg");
        }
        if (!customer)
            throw new errorAPI("Customer not found", 404);
        if (pelanggan_data_jenis || pelanggan_data_file) {
            const customerData = { pelanggan_data_jenis, pelanggan_data_file };
            await prisma.pelanggan_data.update({
                data: customerData,
                where: { pelanggan_data_pelanggan_id: customer.pelanggan_id }
            });
            const updatedCustomer = await prisma.pelanggan.findUnique({
                where: { pelanggan_id: customer.pelanggan_id },
                include: { pelanggan_data: true }
            });
            return res.status(200).json({
                success: true,
                message: "Successfully updated customer",
                data: updatedCustomer
            });
        }
        return res.status(200).json({
            success: true,
            message: "Successfully updated customer",
            data: customer
        });
    }
    catch (err) {
        logger.error("Error during updating customer" + err);
        throw err;
    }
};
const destroy = async (req, res) => {
    try {
        const customerData = await prisma.pelanggan_data.findUnique({
            where: {
                pelanggan_data_pelanggan_id: parseInt(req.params.customerId)
            }
        });
        if (customerData && customerData.pelanggan_data_file) {
            deleteFile("customerData", customerData.pelanggan_data_file.split("/").at(-1) || "");
        }
        await prisma.pelanggan.delete({
            where: { pelanggan_id: parseInt(req.params.customerId) }
        });
        return res.status(204);
    }
    catch (err) {
        logger.error("Error during deleting customer" + err);
        throw err;
    }
};
export default { index, selected, create, update, destroy };
