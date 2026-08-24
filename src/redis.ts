import { createClient } from "redis";

const redis = createClient({
    url: "redis://localhost:6379"
});

redis.on("error", (error) => {
    console.error("Redis error:", error);
});

export async function connectRedis() {
    if (!redis.isOpen) {
        await redis.connect();
        console.log("Connected to Redis");
    }
}

export default redis;