import fs from "fs";
import path from "path";
import env from "~/configs/env";
import redis, { RedisClientType } from "redis";
import { cacheDriver } from "~/configs/cache.js";

export let redisClient: RedisClientType;

if (cacheDriver === "redis") {
    redisClient = redis.createClient({
        url: env.penyewaan_REDIS_URL
    });
}

async function connectRedis() {
    if (!redisClient.isOpen) {
        await redisClient.connect();
    }
}

class redisCache {
    async get(key: string) {
        await connectRedis();
        return await redisClient.get(key);
    }
    async set(key: string, value: unknown, ttl: number) {
        await connectRedis();
        if (typeof value === "object") {
            await redisClient.set(key, JSON.stringify(value), { EX: ttl });
            return;
        }
        if (typeof value === "string") {
            await redisClient.set(key, value, { EX: ttl });
            return;
        }
    }
    async del(key: string) {
        await connectRedis();
        await redisClient.del(key);
    }
}

//     CACHE     ---------------------------------------------------------

const cache = new redisCache();

export default cache;
