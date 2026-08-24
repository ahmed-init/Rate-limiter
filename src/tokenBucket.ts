class TokenBucket {
    private tokens: number;
    private lastRefill: number;//last refill oda time

    constructor(
        private capacity: number,
        private refillRate: number
    ) {
        this.tokens = capacity;
        this.lastRefill = Date.now();
    }

    allowRequest(): boolean {
        const now = Date.now();

        const elapsedSeconds = (now - this.lastRefill) / 1000;

        const newTokens = elapsedSeconds * this.refillRate;

        this.tokens = Math.min(
            this.capacity,
            this.tokens + newTokens
        );

        this.lastRefill = now;

        if (this.tokens >= 1) {
            this.tokens -= 1;
            return true;
        }

        return false;
    }
}

export default TokenBucket;