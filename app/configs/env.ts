import dotenv from "dotenv";
import Joi from "joi";

dotenv.config();

const envValidate = Joi.object()
    .keys({
        NODE_ENV: Joi.string().valid("production", "development", "test").required(),
        APP_NAME: Joi.string().allow("").empty("").default("Express RESTful API"),
        HOST: Joi.string().allow("").empty("").default("127.0.0.1"),
        PORT: Joi.number().allow("").empty("").default(3000),

        COST_FACTOR: Joi.number().allow("").empty(""),

        DATABASE_URL: Joi.string().required(),
        FRONTEND_URL: Joi.string().allow("").empty("").default("http://localhost:5173"),

        CACHE_DRIVER: Joi.string().allow("").empty(""),
        CACHE_PREFIX: Joi.string().allow("").empty(""),

        penyewaan_REDIS_URL: Joi.string(),

        JWT_TOKEN_SECRET_PRIVATE: Joi.string().required(),
        JWT_TOKEN_SECRET_PUBLIC: Joi.string().required(),

        REFRESH_TOKEN_EXPIRATION_DAYS: Joi.number().allow("").empty("").default(15),
        ACCESS_TOKEN_EXPIRATION_MINUTES: Joi.number().allow("").empty("").default(30),

        AWS_ENDPOINT: Joi.string().uri(),
        AWS_ACCESS_KEY_ID: Joi.string(),
        AWS_SECRET_ACCESS_KEY: Joi.string(),
        AWS_REGION: Joi.string(),
        AWS_BUCKET_NAME: Joi.string(),
        OBJECT_URL: Joi.string().uri()
    })
    .unknown();

const { value: env, error } = envValidate.prefs({ errors: { label: "key" } }).validate(process.env);

if (error) {
    throw new Error(`Config env error: ${error.message}`);
}

export default {
    NODE_ENV: env.NODE_ENV,
    APP_NAME: env.APP_NAME,
    HOST: env.HOST,
    PORT: env.PORT,

    DATABASE_URL: env.DATABASE_URL,
    FRONTEND_URL: env.FRONTEND_URL,

    COST_FACTOR: Number(env.COST_FACTOR),

    CACHE_DRIVER: env.CACHE_DRIVER,
    CACHE_PREFIX: env.CACHE_PREFIX,

    penyewaan_REDIS_URL: env.penyewaan_REDIS_URL,

    JWT_TOKEN_SECRET_PRIVATE: Buffer.from(env.JWT_TOKEN_SECRET_PRIVATE, "base64").toString("utf-8"),
    JWT_TOKEN_SECRET_PUBLIC: Buffer.from(env.JWT_TOKEN_SECRET_PUBLIC, "base64").toString("utf-8"),

    REFRESH_TOKEN_EXPIRATION_DAYS: env.REFRESH_TOKEN_EXPIRATION_DAYS,
    ACCESS_TOKEN_EXPIRATION_MINUTES: env.ACCESS_TOKEN_EXPIRATION_MINUTES,

    AWS_ENDPOINT: env.AWS_ENDPOINT,
    AWS_ACCESS_KEY_ID: env.AWS_ACCESS_KEY_ID,
    AWS_SECRET_ACCESS_KEY: env.AWS_SECRET_ACCESS_KEY,
    AWS_REGION: env.AWS_REGION,
    AWS_BUCKET_NAME: env.AWS_BUCKET_NAME,
    OBJECT_URL: env.OBJECT_URL
};
