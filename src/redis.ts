import { createClient } from "redis";

console.log("Starting Redis test...");

const redis = createClient({
    url: "redis://localhost:6379"
});

redis.on("error", (error) => {
    console.error("Redis error:", error);
});

async function testRedis() {
    console.log("Connecting to Redis...");

    await redis.connect();

    console.log("Connected to Redis!");

    await redis.set("test", "hello");

    console.log("Value stored.");

    const value = await redis.get("test");

    console.log("Value from Redis:", value);

    await redis.disconnect();

    console.log("Disconnected from Redis.");
}

testRedis().catch((error) => {
    console.error("Test failed:", error);
});