const crypto = require("crypto");
const bcrypt = require("bcrypt");
const prisma = require("../lib/prisma");

async function apiKeyAuth(req, res, next) {
  try {
    const apiKey = req.header("X-API-Key");
    const apiSecret = req.header("X-API-Secret");

    if (!apiKey || !apiSecret) {
      return res.status(401).json({
        success: false,
        error: {
          code: "INVALID_API_CREDENTIALS",
          message: "X-API-Key and X-API-Secret headers are required"
        }
      });
    }

    // Hash the API key for database lookup
    const keyHash = crypto
      .createHash("sha256")
      .update(apiKey)
      .digest("hex");

    const apiKeyRecord = await prisma.api_keys_new.findUnique({
      where: {
        key_hash: keyHash
      },
      include: {
        user: true
      }
    });

    // API key does not exist
    if (!apiKeyRecord) {
      return res.status(401).json({
        success: false,
        error: {
          code: "INVALID_API_KEY",
          message: "Invalid API key"
        }
      });
    }

    // API key inactive
    if (!apiKeyRecord.is_active) {
      return res.status(401).json({
        success: false,
        error: {
          code: "INVALID_API_KEY",
          message: "API key is inactive"
        }
      });
    }

    // API key expired
    if (
      apiKeyRecord.expires_at &&
      new Date(apiKeyRecord.expires_at) < new Date()
    ) {
      return res.status(401).json({
        success: false,
        error: {
          code: "INVALID_API_KEY",
          message: "API key has expired"
        }
      });
    }

    // Verify API secret
    const secretValid = await bcrypt.compare(
      apiSecret,
      apiKeyRecord.secret_hash
    );

    if (!secretValid) {
      return res.status(401).json({
        success: false,
        error: {
          code: "INVALID_API_SECRET",
          message: "Invalid API secret"
        }
      });
    }

    // Attach authenticated API key and user
    req.apiKey = apiKeyRecord;
    req.user = apiKeyRecord.user;

    next();
  } catch (error) {
    console.error("API credential authentication failed:", error);

    return res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Authentication service error"
      }
    });
  }
}

module.exports = apiKeyAuth;