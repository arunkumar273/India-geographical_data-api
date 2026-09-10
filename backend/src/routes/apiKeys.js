const express = require("express");
const crypto = require("crypto");
const bcrypt = require("bcrypt");
const prisma = require("../lib/prisma");
const jwtAuth = require("../middleware/jwtAuth.js");
const router = express.Router();

// Generate a secure API key
function generateApiKey() {
  return `vg_${crypto.randomBytes(24).toString("hex")}`;
}

// Generate a secure API secret
function generateApiSecret() {
  return crypto.randomBytes(32).toString("hex");
}

// All API-key management routes require JWT authentication
router.use(jwtAuth);

// Create API key + secret
router.post("/", async (req, res) => {
  try {
    const { name, expiresAt } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "API key name is required"
        }
      });
    }

    const apiKey = generateApiKey();
    const apiSecret = generateApiSecret();

    const keyHash = crypto
      .createHash("sha256")
      .update(apiKey)
      .digest("hex");

    const secretHash = await bcrypt.hash(apiSecret, 12);

    let expiry = null;

    if (expiresAt) {
      expiry = new Date(expiresAt);

      if (Number.isNaN(expiry.getTime())) {
        return res.status(400).json({
          success: false,
          error: {
            code: "INVALID_EXPIRY",
            message: "Invalid expiration date"
          }
        });
      }

      if (expiry <= new Date()) {
        return res.status(400).json({
          success: false,
          error: {
            code: "INVALID_EXPIRY",
            message: "Expiration date must be in the future"
          }
        });
      }
    }

    const record = await prisma.api_keys_new.create({
      data: {
        user_id: req.user.id,
        name: name.trim(),
        key_hash: keyHash,
        secret_hash: secretHash,
        is_active: true,
        expires_at: expiry
      },
      select: {
        id: true,
        name: true,
        is_active: true,
        created_at: true,
        expires_at: true
      }
    });

    // IMPORTANT:
    // The raw API key and secret are returned only at creation time.
    res.status(201).json({
      success: true,
      message: "API credentials created successfully",
      data: {
        id: record.id,
        name: record.name,
        apiKey,
        apiSecret,
        isActive: record.is_active,
        createdAt: record.created_at,
        expiresAt: record.expires_at
      }
    });
  } catch (error) {
    console.error("API credential creation failed:", error);

    res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to create API credentials"
      }
    });
  }
});

// List current user's API keys
router.get("/", async (req, res) => {
  try {
    const keys = await prisma.api_keys_new.findMany({
      where: {
        user_id: req.user.id
      },
      orderBy: {
        created_at: "desc"
      },
      select: {
        id: true,
        name: true,
        is_active: true,
        created_at: true,
        expires_at: true
      }
    });

    res.json({
      success: true,
      count: keys.length,
      data: keys
    });
  } catch (error) {
    console.error("Failed to fetch API keys:", error);

    res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to fetch API keys"
      }
    });
  }
});

// Deactivate an API key
router.patch("/:id/deactivate", async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: "INVALID_ID",
          message: "Invalid API key ID"
        }
      });
    }

    const existingKey = await prisma.api_keys_new.findFirst({
      where: {
        id,
        user_id: req.user.id
      }
    });

    if (!existingKey) {
      return res.status(404).json({
        success: false,
        error: {
          code: "NOT_FOUND",
          message: "API key not found"
        }
      });
    }

    const updatedKey = await prisma.api_keys_new.update({
      where: {
        id
      },
      data: {
        is_active: false
      },
      select: {
        id: true,
        name: true,
        is_active: true,
        created_at: true,
        expires_at: true
      }
    });

    res.json({
      success: true,
      message: "API key deactivated successfully",
      data: updatedKey
    });
  } catch (error) {
    console.error("API key deactivation failed:", error);

    res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to deactivate API key"
      }
    });
  }
});

module.exports = router;