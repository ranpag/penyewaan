import fs from "fs";
import path from "path";
import redis from "redis";
import { cacheConfig, cacheDriver } from "~/configs/cache.js";
//     FILE     ---------------------------------------------------------
const filePath = path.resolve(cacheConfig.file.storagePath);
if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify({}));
}
class fileCache {
    get(key) {
        const cache = JSON.parse(fs.readFileSync(filePath, "utf-8"));
        if (cache[key].expiresAt < Date.now())
            delete cache[key];
        return cache[key] ?? null;
    }
    set(key, value, ttl) {
        const cache = JSON.parse(fs.readFileSync(filePath, "utf-8"));
        cache[key] = { value, expiresAt: Date.now() + ttl * 1000 };
        fs.writeFileSync(filePath, JSON.stringify(cache));
    }
    del(key) {
        const cache = JSON.parse(fs.readFileSync(filePath, "utf-8"));
        delete cache[key];
        fs.writeFileSync(filePath, JSON.stringify(cache));
    }
}
//     REDIS     ---------------------------------------------------------
export let redisClient;
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
    async get(key) {
        await connectRedis();
        const value = await redisClient.get(key);
        return value ? JSON.parse(value) : null;
    }
    async set(key, value, ttl) {
        await connectRedis();
        await redisClient.set(key, JSON.stringify(value), { EX: ttl });
    }
    async del(key) {
        await connectRedis();
        await redisClient.del(key);
    }
}
//     CACHE     ---------------------------------------------------------
let cache;
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
