import { PrismaClient } from "@prisma/client";
import { logger } from "../utils/logger";

const prisma = new PrismaClient();

prisma.$use(async (params, next) => {
    const before = Date.now();

    const result = await next(params);

    const after = Date.now();

    logger.log({
        level: "database",
        message: `Query: ${params.model}.${params.action}\nDuration: ${after - before}ms`
    });

    return result;
});

export default prisma;
