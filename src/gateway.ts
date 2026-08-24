import express from "express";
import TokenBucket from "./tokenBucket.js";

const app = express();

const bucket = new TokenBucket(10, 10);

app.get("/api/hello", async (req, res) => {
    const allowed = bucket.allowRequest();

    if (!allowed) {
        return res.status(429).json({
            error: "Too Many Requests"
        });
    }

    try {
        const response = await fetch("http://localhost:4000/api/hello");

        const data = await response.json();

        res.json(data);
    } catch (error) {
        console.error("Upstream error:", error);

        res.status(500).json({
            error: "Upstream service unavailable"
        });
    }
});

app.listen(3000, () => {
    console.log("API Gateway is listening on port 3000");
});