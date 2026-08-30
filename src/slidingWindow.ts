import fs from "node:fs";
import redis from "./redis.js";

const luaScript = fs.readFileSync(
    "./src/slidingWindow.lua",
    "utf8"
);

const LIMIT = 10;
const WINDOW = 10;

export async function slidingWindow(
    key: string
): Promise<boolean> {

    const now = Date.now();

    const result = await redis.eval(luaScript, {
        keys: [key],
        arguments: [
            LIMIT.toString(),
            WINDOW.toString(),
            now.toString()
        ]
    });

    const allowed = Number((result as number[])[0]);

    return allowed === 1;
}