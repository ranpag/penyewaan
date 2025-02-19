import { Request, Response } from "express";
import prisma from "~/src/database/prisma";
import { logger } from "@utils/logger";
import { errorAPI } from "@utils/errorAPI";
import { deleteFile } from "@services/fileService";
import { checkNaN } from "../utils/checkNaN";
import { Prisma } from "@prisma/client";

const index = async (req: Request, res: Response) => {
    const { page, search } = req.query;
    const limit = 25;
    const keywords = Array.isArray(search)
        ? search.map((item) => (typeof item === "string" ? item : undefined)).filter((e) => String(e).trim())
        : typeof search === "string"
          ? [search]
          : undefined;

    try {
        const customers = await prisma.pelanggan.findMany({
            where: {
                OR: keywords?.flatMap((keyword) => [
                    { pelanggan_nama: { contains: keyword, mode: "insensitive" } },
                    { pelanggan_email: { contains: keyword, mode: "insensitive" } }
                ])
            },
            include: {
                pelanggan_data: true,
                _count: true
            },
            take: limit,
            skip: typeof page === "string" ? Number(page) * limit - limit : 0
        });

        const totalCustomers = await prisma.pelanggan.count({
            where: {
                OR: keywords?.flatMap((keyword) => [
                    { pelanggan_nama: { contains: keyword, mode: "insensitive" } },
                    { pelanggan_email: { contains: keyword, mode: "insensitive" } }
                ])
            }
        });

        return res.status(200).json({
            success: true,
            message: "Success mendapatkan semua pelanggan",
            data: customers,
            pagination: {
                item: customers.length,
                matchData: totalCustomers,
                allPage: Math.ceil(totalCustomers / limit),
                currentPage: Number(page) || 1
            }
        });
    } catch (err) {
        logger.error("Error during fetching all customers" + err);
        throw err;
    }
};

const selected = async (req: Request, res: Response) => {
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

        if (!customer) throw new errorAPI("Pelanggan tidak ditemukan", 404);

        return res.status(200).json({
            success: true,
            message: "Success mendapatkan pelanggan",
            data: customer
        });
    } catch (err) {
        logger.error("Error during fetching customer by ID" + err);
        throw err;
    }
};

const create = async (req: Request, res: Response) => {
    const { pelanggan_data_jenis, pelanggan_data_file, ...onlyCustomer } = req.body;

    try {
        if (pelanggan_data_file && pelanggan_data_jenis) {
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
        } else {
            const customer = await prisma.pelanggan.create({
                data: {
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
    } catch (err) {
        logger.error("Error during creating new customer" + err);
        throw err;
    }
};

const update = async (req: Request, res: Response) => {
    const { pelanggan_data_jenis, pelanggan_data_file, ...onlyCustomer } = req.body;
    const { customerId } = req.params;

    try {
        const resultNumberParams = checkNaN({ customerId });

        if (onlyCustomer.pelanggan_email) {
            const uniqueCustomer = await prisma.pelanggan.findFirst({
                where: {
                    pelanggan_email: onlyCustomer.pelanggan_email,
                    NOT: { pelanggan_id: resultNumberParams.customerId }
                }
            });

            if (uniqueCustomer) {
                throw new errorAPI("Validation Error", 400, { pelanggan_email: ["Email pelanggan sudah digunakan"] });
            }
        }

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
                    try {
                        await deleteFile("customerData", existingCustomer.pelanggan_data?.pelanggan_data_file.split("/").at(-1) || "");
                    } catch (error) {
                        logger.error("Error during deleting images: " + error);
                    }
                }

                return {
                    ...existingCustomer,
                    pelanggan_data: updatedCustomerData
                };
            }

            if ((pelanggan_data_jenis || pelanggan_data_file) && !existingCustomer.pelanggan_data) {
                if (!pelanggan_data_file && !pelanggan_data_jenis) {
                    throw new errorAPI("Validation error", 400, {
                        pelanggan_data_jenis: ["Pelanggan data jenis dan Pelanggan data file harus ada"],
                        pelanggan_data_file: ["Pelanggan data jenis dan Pelanggan data file harus ada"]
                    });
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
    } catch (err) {
        logger.error("Error during updating customer" + err);

        if (err instanceof Prisma.PrismaClientKnownRequestError) {
            if (err.code === "P2025") {
                throw new errorAPI("Pelanggan tidak ditemukan", 404);
            }
        }

        throw err;
    }
};

const destroy = async (req: Request, res: Response) => {
    const { customerId } = req.params;

    try {
        const resultNumberParams = checkNaN({ customerId });

        const customerData = await prisma.pelanggan_data.findUnique({
            where: {
                pelanggan_data_pelanggan_id: resultNumberParams.customerId
            }
        });

        const customerRentalNotReturn = await prisma.penyewaan.findFirst({
            where: {
                penyewaan_pelanggan_id: resultNumberParams.customerId,
                penyewaan_sttskembali: "BELUM_KEMBALI"
            }
        });

        if (customerRentalNotReturn) {
            throw new errorAPI("Pelanggan tidak bisa dihapus karena ada penyewaan alat yang belum kembali", 400);
        }

        if (!customerData) {
            throw new errorAPI("Pelanggan tidak ditemukan", 404)
        }

        if (customerData && customerData.pelanggan_data_file) {
            try {
                await deleteFile("customerData", customerData.pelanggan_data_file.split("/").at(-1) || "");
            } catch (error) {
                logger.error("Error during deleting images: " + error);
            }
        }

        await prisma.pelanggan.delete({
            where: { pelanggan_id: resultNumberParams.customerId }
        });

        return res.status(204).send();
    } catch (err) {
        logger.error("Error during deleting customer" + err);
        throw err;
    }
};

export default { index, selected, create, update, destroy };
