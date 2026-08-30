# Redis-Backed Distributed API Rate Limiter

A Node.js and TypeScript API Gateway that implements distributed rate limiting using **Token Bucket** and **Sliding Window Counter** algorithms, with Redis and Lua scripts for atomic operations.

## Architecture

```text
                    Client
                      │
                      ▼
              ┌───────────────┐
              │  API Gateway  │
              └───────┬───────┘
                      │
              ┌───────┴────────┐
              │ Rate Limiter   │
              └───────┬────────┘
                      │
             ┌────────┴─────────┐
             ▼                  ▼
       Token Bucket      Sliding Window
             │                  │
             └────────┬─────────┘
                      ▼
                 Redis + Lua
                      │
               ┌──────┴──────┐
               ▼             ▼
             ALLOW          429
               │
               ▼
          Upstream API
```

## Features

* Token Bucket rate limiting
* Sliding Window Counter rate limiting
* Redis-backed shared rate-limit state
* Atomic rate-limit operations using Lua scripts
* Per-client rate limiting using API keys
* Multiple gateway instances sharing the same Redis state
* HTTP `429 Too Many Requests` handling
* Redis failure handling with HTTP `503`
* Dockerized Redis
* Load testing with Autocannon

## Rate Limiting

Each client receives an independent rate-limit bucket based on its API key.

Example:

```text
X-API-Key: client-a
→ rate_limit:client-a

X-API-Key: client-b
→ rate_limit:client-b
```

This prevents one client from consuming another client's rate limit.

## Distributed Rate Limiting

Multiple gateway instances can run simultaneously and share the same Redis instance.

```text
Gateway 1 ──┐
            ├── Redis
Gateway 2 ──┘
```

Because the rate-limit state is stored in Redis and the operations are executed atomically through Lua scripts, both gateway instances enforce the same client limit.

This was verified by running two gateway instances on different ports and sending requests using the same API key.

## Algorithms

### Token Bucket

The bucket has a fixed capacity and tokens are refilled continuously at a configured rate. Each accepted request consumes one token.

This allows controlled bursts while maintaining an average request rate.

### Sliding Window Counter

Requests are grouped into time buckets and counted within a recent time window. Requests are rejected when the number of requests in the window reaches the configured limit.

## Failure Handling

The gateway uses a **fail-closed** approach for Redis failures.

```text
Redis available
     ↓
Rate limit request
     ↓
ALLOW / 429

Redis unavailable
     ↓
503 Service Unavailable
```

This prevents unlimited traffic from bypassing the rate limiter when Redis is unavailable.

## Testing

Autocannon was used to test the gateway:

```bash
npx autocannon -c 1 -a 20 \
  -H "X-API-Key: test-client" \
  http://localhost:3000/api/hello
```

With a configured limit of 10 requests, the tests demonstrated approximately:

```text
20 total requests
10 successful responses
10 rate-limited responses
```

The distributed test also verified that two gateway instances share the same Redis-backed rate-limit state.

## Tech Stack

* Node.js
* TypeScript
* Express
* Redis
* Lua
* Docker / Docker Compose
* Autocannon

## Project Structure

```text
RateLimiter/
├── src/
│   ├── gateway.ts
│   ├── upstream.ts
│   ├── redis.ts
│   ├── tokenBucket.lua
│   ├── tokenBucket.ts
│   ├── slidingWindow.lua
│   └── slidingWindow.ts
├── docker-compose.yml
├── package.json
├── package-lock.json
└── tsconfig.json
```
