const redis = require("../lib/redis");

const PLAN_LIMITS = {
  FREE: {
    daily: 5000,
    burst: 100
  },
  PREMIUM: {
    daily: 50000,
    burst: 500
  },
  PRO: {
    daily: 300000,
    burst: 2000
  },
  UNLIMITED: {
    daily: 1000000,
    burst: 5000
  }
};

async function rateLimiter(req, res, next) {
  try {
    /*
     * API-key authentication should already have run.
     * apiKeyAuth sets req.apiKey and req.plan.
     */

    if (!req.apiKey) {
      return res.status(401).json({
        success: false,
        error: {
          code: "INVALID_API_KEY",
          message: "API authentication is required before rate limiting"
        }
      });
    }

    const planCode = String(req.plan?.code || "FREE").toUpperCase();
    console.log(
    "RATE LIMIT PLAN:",
    req.plan?.code,
    "BURST:",
    req.plan?.burst_limit,
    "DAILY:",
    req.plan?.daily_request_limit
);
    const limits = PLAN_LIMITS[planCode] || PLAN_LIMITS.FREE;

    // IMPORTANT:
    // Quotas are tracked PER API KEY, not per user.
    const apiKeyId = String(req.apiKey.id);

    const now = Date.now();

    // UTC date for daily quota
    const today = new Date().toISOString().slice(0, 10);

    const minuteWindow = Math.floor(now / 60000);

    const dailyKey = `ratelimit:daily:${apiKeyId}:${today}`;
    const burstKey = `ratelimit:burst:${apiKeyId}:${minuteWindow}`;

    /*
     * Increment both counters.
     */
    const dailyCount = await redis.incr(dailyKey);
    const burstCount = await redis.incr(burstKey);

    /*
     * Set expiration only when the key is first created.
     */
    if (dailyCount === 1) {
      await redis.expire(dailyKey, 86400);
    }

    if (burstCount === 1) {
      await redis.expire(burstKey, 120);
    }

    const dailyRemaining = Math.max(
      0,
      limits.daily - dailyCount
    );

    const burstRemaining = Math.max(
      0,
      limits.burst - burstCount
    );

    /*
     * The effective limit is the smaller remaining quota.
     */
    const remaining = Math.min(
      dailyRemaining,
      burstRemaining
    );

    /*
     * Reset timestamp:
     * minute burst resets at the next minute.
     */
    const burstReset = (minuteWindow + 1) * 60000;

    /*
     * Daily reset at next UTC midnight.
     */
    const tomorrow = new Date();
    tomorrow.setUTCHours(24, 0, 0, 0);

    const dailyReset = tomorrow.getTime();

    const reset = Math.min(
      burstReset,
      dailyReset
    );

    /*
     * Required workflow headers.
     */
    res.setHeader(
      "X-RateLimit-Limit",
      Math.min(limits.daily, limits.burst)
    );

    res.setHeader(
      "X-RateLimit-Remaining",
      remaining
    );

    res.setHeader(
      "X-RateLimit-Reset",
      Math.floor(reset / 1000)
    );

    /*
     * Daily quota exceeded.
     */
    if (dailyCount > limits.daily) {
      return res.status(429).json({
        success: false,
        error: {
          code: "RATE_LIMITED",
          message: `Daily API request limit exceeded for ${planCode} plan`
        },
        meta: {
          rateLimit: {
            limit: limits.daily,
            remaining: 0,
            reset: Math.floor(dailyReset / 1000)
          }
        }
      });
    }

    /*
     * Per-minute burst exceeded.
     */
    if (burstCount > limits.burst) {
      return res.status(429).json({
        success: false,
        error: {
          code: "RATE_LIMITED",
          message: `Per-minute API request limit exceeded for ${planCode} plan`
        },
        meta: {
          rateLimit: {
            limit: limits.burst,
            remaining: 0,
            reset: Math.floor(burstReset / 1000)
          }
        }
      });
    }

    /*
     * Make quota information available to API routes.
     */
    req.rateLimit = {
      plan: planCode,
      dailyLimit: limits.daily,
      dailyUsed: dailyCount,
      dailyRemaining,
      burstLimit: limits.burst,
      burstUsed: burstCount,
      burstRemaining,
      reset
    };

    next();
  } catch (error) {
    console.error("Rate limiter failed:", error);

    /*
     * Fail open:
     * Redis failure should not bring the entire API down.
     */
    next();
  }
}

module.exports = rateLimiter;