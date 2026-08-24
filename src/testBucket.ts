import TokenBucket from "./tokenBucket";

const bucket = new TokenBucket(5, 1);

for (let i = 1; i <= 7; i++) {
    const allowed = bucket.allowRequest();

    console.log(
        `Request ${i}: ${allowed ? "ALLOWED" : "REJECTED"}`
    );
}