import { logger } from "./src/utils/logger.js";
// import fs from "fs";
// import http2 from "http2";
import env from "./configs/env.js";
import prisma from "./src/database/prisma.js";
import app from "./app.js";
import { cacheDriver } from "./configs/cache.js";
import { redisClient } from "./src/services/cacheService.js";
// Unhandled error handling
process.on("unhandledRejection", (reason) => {
    logger.error("Unhandled Rejection:", reason);
});
process.on("uncaughtException", async (err) => {
    logger.error("Uncaught Exception:", err);
    await prisma.$disconnect();
    if (cacheDriver === "redis")
        await redisClient.disconnect();
    process.exit(1);
});
// Closing system
process.on("SIGTERM", async () => {
    logger.log("info", "Server shutting down...");
    await prisma.$disconnect();
    if (cacheDriver === "redis")
        await redisClient.disconnect();
    process.exit(0);
});
process.on("SIGINT", async () => {
    logger.log("info", "Server interrupted...");
    await prisma.$disconnect();
    if (cacheDriver === "redis")
        await redisClient.disconnect();
    process.exit(0);
});
// Run server
// const serverOptions = {
//     key: fs.readFileSync("./storages/ssl/server.key"),
//     cert: fs.readFileSync("./storages/ssl/server.crt"),
//     allowHTTP1: true
// };
// const server = http2.createSecureServer(serverOptions, (req, res) => {
//     // Manually wrap the request/response to match Express's expectations
//     app(req as unknown as Request, res as unknown as Response);
// });
app.listen(env.PORT, () => {
    logger.info(`Server HTTP/1.1 berjalan di http://${env.HOST}:${env.PORT}`);
});
export default app;
