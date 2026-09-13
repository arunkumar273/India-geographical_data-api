const crypto = require("crypto");
const bcrypt = require("bcrypt");
const prisma = require("../lib/prisma");

async function apiKeyAuth(req, res, next) {
  try {
    const apiKey = req.header("X-API-Key");
    const apiSecret = req.header("X-API-Secret");

    // --------------------------------------------------
    // 1. Validate headers
    // --------------------------------------------------

    if (!apiKey) {
      return res.status(401).json({
        success: false,
        error: {
          code: "INVALID_API_KEY",
          message: "X-API-Key header is required",
        },
      });
    }

    if (!apiSecret) {
      return res.status(401).json({
        success: false,
        error: {
          code: "INVALID_API_CREDENTIALS",
          message: "X-API-Secret header is required",
        },
      });
    }

    // New workflow format:
    // ak_ + 32 hexadecimal characters
    if (!/^ak_[a-f0-9]{32}$/i.test(apiKey)) {
      return res.status(401).json({
        success: false,
        error: {
          code: "INVALID_API_KEY",
          message: "Invalid API key format",
        },
      });
    }

    // as_ + 32 hexadecimal characters
    if (!/^as_[a-f0-9]{32}$/i.test(apiSecret)) {
      return res.status(401).json({
        success: false,
        error: {
          code: "INVALID_API_SECRET",
          message: "Invalid API secret format",
        },
      });
    }

    // --------------------------------------------------
    // 2. Hash API key
    // --------------------------------------------------

    const keyHash = crypto
      .createHash("sha256")
      .update(apiKey)
      .digest("hex");

    // --------------------------------------------------
    // 3. Find API key + user + plan
    // --------------------------------------------------

    const apiKeyRecord = await prisma.api_keys_new.findUnique({
      where: {
        key_hash: keyHash,
      },
      include: {
        user: {
          include: {
            plan: true,
          },
        },
      },
    });

    // --------------------------------------------------
    // 4. API key must exist
    // --------------------------------------------------

    if (!apiKeyRecord) {
      return res.status(401).json({
        success: false,
        error: {
          code: "INVALID_API_KEY",
          message: "Invalid API key",
        },
      });
    }

    // --------------------------------------------------
    // 5. API key must be active
    // --------------------------------------------------

    if (!apiKeyRecord.is_active) {
      return res.status(401).json({
        success: false,
        error: {
          code: "INVALID_API_KEY",
          message: "API key is inactive",
        },
      });
    }

    // --------------------------------------------------
    // 6. Check API key expiration
    // --------------------------------------------------

    if (
      apiKeyRecord.expires_at &&
      new Date(apiKeyRecord.expires_at) <= new Date()
    ) {
      return res.status(401).json({
        success: false,
        error: {
          code: "INVALID_API_KEY",
          message: "API key has expired",
        },
      });
    }

    // --------------------------------------------------
    // 7. Verify API secret
    // --------------------------------------------------

    const secretValid = await bcrypt.compare(
      apiSecret,
      apiKeyRecord.secret_hash
    );

    if (!secretValid) {
      return res.status(401).json({
        success: false,
        error: {
          code: "INVALID_API_SECRET",
          message: "Invalid API secret",
        },
      });
    }

    // --------------------------------------------------
    // 8. Validate associated user
    // --------------------------------------------------

    const user = apiKeyRecord.user;

    if (!user) {
      return res.status(401).json({
        success: false,
        error: {
          code: "INVALID_API_KEY",
          message: "API key owner not found",
        },
      });
    }

    // API credentials are for B2B accounts
    if (user.role !== "B2B") {
      return res.status(403).json({
        success: false,
        error: {
          code: "ACCESS_DENIED",
          message: "API access is restricted to B2B accounts",
        },
      });
    }

    // Account must be approved
    if (user.approval_status !== "APPROVED") {
      return res.status(403).json({
        success: false,
        error: {
          code: "ACCESS_DENIED",
          message: "B2B account has not been approved",
        },
      });
    }

    // Account must be active
    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        error: {
          code: "ACCESS_DENIED",
          message: "B2B account is inactive",
        },
      });
    }

    // --------------------------------------------------
    // 9. Verify plan exists
    // --------------------------------------------------

    if (!user.plan) {
      return res.status(403).json({
        success: false,
        error: {
          code: "ACCESS_DENIED",
          message: "No active plan is assigned to this account",
        },
      });
    }

    // --------------------------------------------------
    // 10. Attach authentication context
    // --------------------------------------------------

    req.apiKey = apiKeyRecord;

    req.user = user;

    req.plan = user.plan;

    // Useful identifiers for logging / rate limiting
    req.apiKeyId = apiKeyRecord.id;
    req.userId = user.id;
    req.planId = user.plan_id;

    // Continue
    next();
  } catch (error) {
    console.error(
      "API credential authentication failed:",
      error
    );

    return res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Authentication service error",
      },
    });
  }
}

module.exports = apiKeyAuth;