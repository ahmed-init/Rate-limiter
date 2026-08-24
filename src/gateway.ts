import express from "express";
import fs from "node:fs";
import redis, { connectRedis } from "./redis.js";

const app = express();

const luaScript = fs.readFileSync(
    "./src/tokenBucket.lua",
    "utf8"
);

const CAPACITY = 10;
const REFILL_RATE = 10;

app.get("/api/hello", async (req, res) => {
    try {
        const apiKey = (req.headers["x-api-key"] as string) || "default";

        const key = `rate_limit:${apiKey}`;

        const now = Date.now();

        const result = await redis.eval(luaScript, {
            keys: [key],
            arguments: [
                CAPACITY.toString(),
                REFILL_RATE.toString(),
                now.toString()
            ]
        });

        const allowed = Number((result as number[])[0]);

        if (allowed === 0) {
            return res.status(429).json({
                error: "Too Many Requests"
            });
        }

        const response = await fetch(
            "http://localhost:4000/api/hello"
        );

        const data = await response.json();

        res.json(data);

    } catch (error) {
        console.error("Gateway error:", error);

        res.status(500).json({
            error: "Internal Gateway Error"
        });
    }
});

async function start() {
    await connectRedis();

    app.listen(3000, () => {
        console.log("API Gateway is listening on port 3000");
    });
}

start();