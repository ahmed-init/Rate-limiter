local key = KEYS[1]

local limit = tonumber(ARGV[1])
local window = tonumber(ARGV[2])
local now = tonumber(ARGV[3])

local current_bucket = math.floor(now / 1000)

local window_start = current_bucket - window + 1

local total = 0

local buckets = redis.call(
    "HGETALL",
    key
)

for i = 1, #buckets, 2 do
    local bucket = tonumber(buckets[i])
    local count = tonumber(buckets[i + 1])

    if bucket >= window_start then
        total = total + count
    else
        redis.call("HDEL", key, buckets[i])
    end
end

local allowed = 0

if total < limit then
    local current_count = redis.call(
        "HINCRBY",
        key,
        current_bucket,
        1
    )

    total = total + 1
    allowed = 1
end

redis.call("EXPIRE", key, window)

return { allowed, total }