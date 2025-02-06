import fs from "fs";
import path from "path";
import redis, { RedisClientType } from "redis";
import { cacheConfig, cacheDriver } from "~/configs/cache.js";

//     FILE     ---------------------------------------------------------

const filePath = path.resolve(cacheConfig.file.storagePath);

if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify({}));
}

class fileCache {
    get(key: string) {
        const cache = JSON.parse(fs.readFileSync(filePath, "utf-8"));
        if (cache[key].expiresAt < Date.now()) delete cache[key];
        return cache[key] ?? null;
    }
    set(key: string, value: unknown, ttl: number) {
        const cache = JSON.parse(fs.readFileSync(filePath, "utf-8"));
        cache[key] = { value, expiresAt: Date.now() + ttl * 1000 };
        fs.writeFileSync(filePath, JSON.stringify(cache));
    }
    del(key: string) {
        const cache = JSON.parse(fs.readFileSync(filePath, "utf-8"));
        delete cache[key];
        fs.writeFileSync(filePath, JSON.stringify(cache));
    }
}

//     REDIS     ---------------------------------------------------------

export let redisClient: RedisClientType;

if (cacheDriver === "redis") {
    redisClient = redis.createClient({
        url: "redis://@127.0.0.1:6380"
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
        const value = await redisClient.get(key);
        return value ? JSON.parse(value) : null;
    }
    async set(key: string, value: unknown, ttl: number) {
        await connectRedis();
        await redisClient.set(key, JSON.stringify(value), { EX: ttl });
    }
    async del(key: string) {
        await connectRedis();
        await redisClient.del(key);
    }
}

//     CACHE     ---------------------------------------------------------

let cache: fileCache | redisCache;

switch (cacheDriver) {
    case "file":
        cache = new fileCache();
        break;
    case "redis":
        cache = new redisCache();
        break;
    default:
        throw new Error(`Unsupported cache driver: ${cacheDriver}`);
}

export default cache;
