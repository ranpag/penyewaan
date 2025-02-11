import winston from "winston";
import morgan from "morgan";
import env from "~/configs/env";
// Configuration for logging application
const levels = {
    error: 0,
    warn: 1,
    http: 3,
    debug: 4,
    database: 5,
    info: 2
};
winston.addColors({
    error: "red",
    warn: "yellow",
    http: "green",
    debug: "white",
    database: "blue",
    info: "cyan"
});
export const logger = winston.createLogger({
    level: env.NODE_ENV === "development" ? "debug" : "warn",
    levels,
    format: winston.format.combine(winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }), winston.format.printf((info) => `[${[info.timestamp]}] [${info.level}] => ${info.message}`)),
    transports: [
        new winston.transports.Console({
            level: "http",
        }),
        new winston.transports.Console({
            level: "database",
        }),
        new winston.transports.Console({
            level: "error",
        }),
        new winston.transports.Console(),
        new winston.transports.Console({
            format: winston.format.combine(winston.format.colorize({ all: true }))
        })
    ]
});
export const logHTTP = morgan("combined", {
    stream: { write: (message) => logger.http(message.trim()) }
});
export default { logger, logHTTP };
