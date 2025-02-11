import prisma from "~/src/database/prisma";
import { logger } from "@utils/logger";
import { errorAPI } from "@utils/errorAPI";
import { deleteFile } from "@services/fileService";
import { checkNaN } from "../utils/checkNaN.js";
import { Prisma } from "@prisma/client";
const index = async (req, res) => {
    try {
        const customers = await prisma.pelanggan.findMany({
            include: {
                pelanggan_data: true,
                _count: true
            },
            take: 10,
            skip: typeof req.query.page === "string" ? Number(req.query.page) * 10 - 10 : 0
        });
        const totalCustomers = await prisma.pelanggan.count();
        return res.status(200).json({
            success: true,
            message: "Success mendapatkan semua pelanggan",
            data: customers,
            pagination: {
                totalItem: customers.length,
                totalData: totalCustomers,
                totalPage: totalCustomers > 10 ? Math.floor(totalCustomers / customers.length) + 1 : Math.floor(totalCustomers / customers.length)
            }
        });
    }
    catch (err) {
        logger.error("Error during fetching all customers" + err);
        throw err;
    }
};
const selected = async (req, res) => {
    const { customerId } = req.params;
    try {
        const resultNumberParams = checkNaN({ customerId });
        const customer = await prisma.pelanggan.findUnique({
            where: {
                pelanggan_id: resultNumberParams.customerId
            },
            include: {
                pelanggan_data: true,
                penyewaan: {
                    include: {
                        _count: true
                    }
                },
                _count: true
            }
        });
        if (!customer)
            throw new errorAPI("Pelanggan tidak ditemukan", 404);
        return res.status(200).json({
            success: true,
            message: "Success mendapatkan pelanggan",
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
            data: {
                pelanggan_data: {
                    create: {
                        pelanggan_data_jenis: pelanggan_data_jenis,
                        pelanggan_data_file: pelanggan_data_file
                    }
                },
                ...onlyCustomer
            },
            include: {
                pelanggan_data: true,
                _count: true
            }
        });
        return res.status(201).json({
            success: true,
            message: "Success membuat pelanggan baru",
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
    const { customerId } = req.params;
    try {
        const resultNumberParams = checkNaN({ customerId });
        const result = await prisma.$transaction(async (tx) => {
            const existingCustomer = await tx.pelanggan.update({
                data: onlyCustomer,
                where: { pelanggan_id: resultNumberParams.customerId },
                include: { pelanggan_data: true }
            });
            if ((pelanggan_data_jenis || pelanggan_data_file) && existingCustomer.pelanggan_data) {
                const updatedCustomerData = await tx.pelanggan_data.update({
                    data: {
                        pelanggan_data_jenis,
                        pelanggan_data_file
                    },
                    where: { pelanggan_data_pelanggan_id: existingCustomer.pelanggan_id }
                });
                if (pelanggan_data_file && existingCustomer.pelanggan_data?.pelanggan_data_file) {
                    deleteFile("customerData", existingCustomer.pelanggan_data?.pelanggan_data_file.split("/").at(-1) || "a.jpg");
                }
                return {
                    ...existingCustomer,
                    pelanggan_data: updatedCustomerData
                };
            }
            if ((pelanggan_data_jenis || pelanggan_data_file) && !existingCustomer.pelanggan_data) {
                if (pelanggan_data_file || pelanggan_data_jenis) {
                    throw new errorAPI("Validation error", 400, ["Pelanggan data jenis dan Pelanggan data file harus ada"]);
                }
                const newCustomerData = await tx.pelanggan_data.create({
                    data: {
                        pelanggan_data_jenis,
                        pelanggan_data_file,
                        pelanggan_data_pelanggan_id: existingCustomer.pelanggan_id
                    }
                });
                return {
                    ...existingCustomer,
                    pelanggan_data: newCustomerData
                };
            }
            return existingCustomer;
        });
        return res.status(200).json({
            success: true,
            message: "Success mengupdate customer",
            data: result
        });
    }
    catch (err) {
        logger.error("Error during updating customer" + err);
        if (err instanceof Prisma.PrismaClientKnownRequestError) {
            if (err.code === "P2025") {
                throw new errorAPI("Pelanggan tidak ditemukan", 404);
            }
        }
        throw err;
    }
};
const destroy = async (req, res) => {
    const { customerId } = req.params;
    try {
        const resultNumberParams = checkNaN({ customerId });
        const customerData = await prisma.pelanggan_data.findUnique({
            where: {
                pelanggan_data_pelanggan_id: resultNumberParams.customerId
            }
        });
        if (customerData && customerData.pelanggan_data_file) {
            deleteFile("customerData", customerData.pelanggan_data_file.split("/").at(-1) || "");
        }
        await prisma.pelanggan.delete({
            where: { pelanggan_id: resultNumberParams.customerId }
        });
        return res.status(204).send();
    }
    catch (err) {
        logger.error("Error during deleting customer" + err);
        throw err;
    }
};
export default { index, selected, create, update, destroy };
