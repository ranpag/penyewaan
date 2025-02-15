import env from "~/configs/env";

// Configuration for cache system

export const cacheDriver = env.CACHE_DRIVER;

export const cacheConfig = {
    redis: {
        driver: "redis",
        mode: "standalone",
        url: env.penyewaan_REDIS_URL
    }
};
