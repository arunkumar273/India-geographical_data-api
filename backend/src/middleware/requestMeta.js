const crypto = require("crypto");

function requestMeta(req, res, next) {
  const requestId = crypto.randomUUID();
  const startTime = process.hrtime.bigint();

  req.requestId = requestId;

  res.setHeader("X-Request-ID", requestId);

  res.on("finish", () => {
    const endTime = process.hrtime.bigint();
    const responseTimeMs = Number(endTime - startTime) / 1_000_000;

    console.log(
      `${req.method} ${req.originalUrl} - ${res.statusCode} - ${responseTimeMs.toFixed(2)}ms - ${requestId}`
    );
  });

  next();
}

module.exports = requestMeta;