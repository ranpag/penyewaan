import bcrypt from "bcrypt";
import { PrismaClient } from "@prisma/client";
import { logger } from "../utils/logger";
import env from "~/configs/env";

const prisma = new PrismaClient();

async function main() {
    await prisma.kategori.createMany({
        data: [
            {
                kategori_nama: "Elektronik"
            },
            {
                kategori_nama: "Olahraga"
            },
            {
                kategori_nama: "Pakaian"
            },
            {
                kategori_nama: "Peralatan Dapur"
            },
            {
                kategori_nama: "Buku"
            }
        ]
    });

    await prisma.alat.createMany({
        data: [
            {
                alat_kategori_id: 1, // Elektronik
                alat_nama: "Laptop",
                alat_deskripsi: "Laptop untuk kebutuhan kerja dan hiburan",
                alat_hargaperhari: 100000,
                alat_stok: 10
            },
            {
                alat_kategori_id: 2, // Olahraga
                alat_nama: "Sepeda Gunung",
                alat_deskripsi: "Sepeda untuk berpetualang di alam terbuka",
                alat_hargaperhari: 50000,
                alat_stok: 15
            },
            {
                alat_kategori_id: 3, // Pakaian
                alat_nama: "Kaos Polos",
                alat_deskripsi: "Kaos polos nyaman untuk sehari-hari",
                alat_hargaperhari: 20000,
                alat_stok: 30
            },
            {
                alat_kategori_id: 4, // Peralatan Dapur
                alat_nama: "Panci",
                alat_deskripsi: "Panci untuk memasak berbagai masakan",
                alat_hargaperhari: 30000,
                alat_stok: 25
            },
            {
                alat_kategori_id: 5, // Buku
                alat_nama: "Buku Fiksi",
                alat_deskripsi: "Buku cerita fiksi untuk hiburan",
                alat_hargaperhari: 10000,
                alat_stok: 50
            }
        ]
    });

    await prisma.admin.createMany({
        data: [
            {
                admin_username: "admin1",
                admin_password: bcrypt.hashSync("Admin123$", env.COST_FACTOR)
            },
            {
                admin_username: "admin2",
                admin_password: bcrypt.hashSync("Admin123$", env.COST_FACTOR)
            },
            {
                admin_username: "admin3",
                admin_password: bcrypt.hashSync("Admin123$", env.COST_FACTOR)
            }
        ]
    });

    logger.log({
        level: "database",
        message: "Seeder Succesful"
    });
}

main()
    .catch((e) => {
        throw e;
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
