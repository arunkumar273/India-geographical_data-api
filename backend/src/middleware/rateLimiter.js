const { Ratelimit } = require("@upstash/ratelimit");
const redis = require("../lib/redis");

const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, "1 m"),
  analytics: true
});

async function rateLimiter(req, res, next) {
  try {
    const identifier =
      req.apiKey?.id
        ? `api-key:${req.apiKey.id}`
        : `ip:${req.ip}`;

    const result = await ratelimit.limit(identifier);

    res.setHeader("X-RateLimit-Limit", result.limit);
    res.setHeader("X-RateLimit-Remaining", result.remaining);
    res.setHeader("X-RateLimit-Reset", result.reset);

    if (!result.success) {
      return res.status(429).json({
        success: false,
        error: {
          code: "RATE_LIMIT_EXCEEDED",
          message: "Too many requests. Please try again later."
        }
      });
    }

    next();
  } catch (error) {
    console.error("Rate limiter error:", error);

    // Fail open: don't take the API down if Redis is temporarily unavailable.
    next();
  }
}

module.exports = rateLimiter;