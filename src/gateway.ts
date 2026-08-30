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

        let result;
        try {
            result = await redis.eval(luaScript, {
                keys: [key],
                arguments: [
                    CAPACITY.toString(),
                    REFILL_RATE.toString(),
                    now.toString()
                ]
            });
        } catch (error) {
            console.error("Rate limiter unavailable:", error);

            return res.status(503).json({
                error: "Rate limiter unavailable"
            });//redis is down so gateway can't check limit
        }

        const allowed = Number((result as number[])[0]);

        if (allowed === 0) {
            return res.status(429).json({
                error: "Too Many Requests"
            });//429 means the client exceeded it's token limit
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

    const PORT =Number(process.env.PORT)|| 3000;
    app.listen(PORT, () => {
        console.log(`API Gateway is listening on port ${PORT}`);
    });
}

start();