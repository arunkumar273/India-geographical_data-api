const prisma = require("../lib/prisma");

function apiLogger(req, res, next) {
  const startTime = process.hrtime.bigint();

  res.on("finish", () => {
    const endTime = process.hrtime.bigint();

    const responseTime =
      Number(endTime - startTime) / 1_000_000;

    // Only log authenticated API requests
    if (!req.apiKey || !req.user) {
      return;
    }

    prisma.api_logs
      .create({
        data: {
          api_key_id: req.apiKey.id,
          user_id: req.user.id,
          endpoint: req.originalUrl,
          method: req.method,
          status_code: res.statusCode,
          response_time: responseTime,
          ip_address: req.ip
        }
      })
      .catch((error) => {
        console.error("API log creation failed:", error);
      });
  });

  next();
}

module.exports = apiLogger;