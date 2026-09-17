const express = require("express");
const crypto = require("crypto");
const bcrypt = require("bcrypt");

const prisma = require("../lib/prisma");
const jwtAuth = require("../middleware/jwtAuth.js");

const router = express.Router();

// ============================================================
// CONFIGURATION
// ============================================================

const MAX_ACTIVE_KEYS = 5;

// ============================================================
// HELPERS
// ============================================================

// Generate API key
// Workflow format: ak_[32 hex characters]
function generateApiKey() {
  return `ak_${crypto.randomBytes(16).toString("hex")}`;
}

// Generate API secret
// Workflow format: as_[32 hex characters]
function generateApiSecret() {
  return `as_${crypto.randomBytes(16).toString("hex")}`;
}

// Hash API key using SHA-256
function hashApiKey(apiKey) {
  return crypto
    .createHash("sha256")
    .update(apiKey)
    .digest("hex");
}

// Validate expiry date
function validateExpiry(expiresAt) {
  if (!expiresAt) {
    return {
      valid: true,
      value: null,
    };
  }

  const expiry = new Date(expiresAt);

  if (Number.isNaN(expiry.getTime())) {
    return {
      valid: false,
      message: "Invalid expiration date",
    };
  }

  if (expiry <= new Date()) {
    return {
      valid: false,
      message: "Expiration date must be in the future",
    };
  }

  return {
    valid: true,
    value: expiry,
  };
}

// ============================================================
// ALL API KEY MANAGEMENT ROUTES REQUIRE JWT
// ============================================================

router.use(jwtAuth);

// ============================================================
// CREATE API KEY
// POST /v1/api-keys
// ============================================================
/**
 * @swagger
 * /v1/api-keys:
 *   post:
 *     summary: Create an API key
 *     description: Creates a new API key and secret for the authenticated B2B client. Credentials are returned only when created.
 *     tags:
 *       - API Keys
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Friendly name for the API key
 *               expiresAt:
 *                 type: string
 *                 format: date-time
 *                 description: Optional expiration date
 *     responses:
 *       201:
 *         description: API key created successfully
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Authentication required
 *       403:
 *         description: B2B account is not approved or active
 *       409:
 *         description: Maximum active API keys reached
 *       500:
 *         description: Internal server error
 */
router.post("/", async (req, res) => {
  try {
    const { name, expiresAt } = req.body;

    // --------------------------------------------------------
    // Validate name
    // --------------------------------------------------------

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "API key name is required",
        },
      });
    }

    if (name.trim().length > 150) {
      return res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "API key name cannot exceed 150 characters",
        },
      });
    }

    // --------------------------------------------------------
    // Get current user
    // --------------------------------------------------------

    const currentUser = await prisma.users.findUnique({
      where: {
        id: req.user.id,
      },
      select: {
        id: true,
        role: true,
        approval_status: true,
        is_active: true,
        plan_id: true,
      },
    });

    if (!currentUser) {
      return res.status(401).json({
        success: false,
        error: {
          code: "USER_NOT_FOUND",
          message: "User account not found",
        },
      });
    }

    // --------------------------------------------------------
    // Only B2B users can create API keys
    // --------------------------------------------------------

    if (currentUser.role !== "B2B") {
      return res.status(403).json({
        success: false,
        error: {
          code: "ACCESS_DENIED",
          message: "Only B2B accounts can create API keys",
        },
      });
    }

    // --------------------------------------------------------
    // User must be approved
    // --------------------------------------------------------

    if (currentUser.approval_status !== "APPROVED") {
      return res.status(403).json({
        success: false,
        error: {
          code: "APPROVAL_REQUIRED",
          message:
            "Your account must be approved before creating API keys",
        },
      });
    }

    // --------------------------------------------------------
    // User must be active
    // --------------------------------------------------------

    if (!currentUser.is_active) {
      return res.status(403).json({
        success: false,
        error: {
          code: "ACCOUNT_INACTIVE",
          message:
            "Your account is inactive. API keys cannot be created",
        },
      });
    }

    // --------------------------------------------------------
    // Check maximum active keys
    // --------------------------------------------------------

    const activeKeyCount = await prisma.api_keys_new.count({
      where: {
        user_id: req.user.id,
        is_active: true,
      },
    });

    if (activeKeyCount >= MAX_ACTIVE_KEYS) {
      return res.status(400).json({
        success: false,
        error: {
          code: "MAX_ACTIVE_KEYS",
          message:
            `You can have a maximum of ${MAX_ACTIVE_KEYS} active API keys`,
        },
      });
    }

    // --------------------------------------------------------
    // Validate expiry
    // --------------------------------------------------------

    const expiryResult = validateExpiry(expiresAt);

    if (!expiryResult.valid) {
      return res.status(400).json({
        success: false,
        error: {
          code: "INVALID_EXPIRY",
          message: expiryResult.message,
        },
      });
    }

    // --------------------------------------------------------
    // Generate credentials
    // --------------------------------------------------------

    const apiKey = generateApiKey();
    const apiSecret = generateApiSecret();

    const keyHash = hashApiKey(apiKey);

    const secretHash = await bcrypt.hash(apiSecret, 12);

    // --------------------------------------------------------
    // Save API credentials
    // --------------------------------------------------------

    const record = await prisma.api_keys_new.create({
      data: {
        user_id: req.user.id,
        name: name.trim(),
        key_hash: keyHash,
        secret_hash: secretHash,
        is_active: true,
        expires_at: expiryResult.value,
      },
      select: {
        id: true,
        name: true,
        is_active: true,
        created_at: true,
        expires_at: true,
      },
    });

    // --------------------------------------------------------
    // IMPORTANT:
    // Raw key + secret are returned ONLY at creation.
    // --------------------------------------------------------
/**
 * @swagger
 * /v1/api-keys/{id}/regenerate-secret:
 *   post:
 *     summary: Regenerate API secret
 *     description: Generates a new API secret for an existing API key.
 *     tags:
 *       - API Keys
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: API key ID
 *     responses:
 *       200:
 *         description: API secret regenerated successfully
 *       401:
 *         description: Authentication required
 *       404:
 *         description: API key not found
 *       500:
 *         description: Internal server error
 */
    return res.status(201).json({
      success: true,
      message: "API credentials created successfully",
      data: {
        id: record.id,
        name: record.name,

        // Show only once
        apiKey,
        apiSecret,

        isActive: record.is_active,
        createdAt: record.created_at,
        expiresAt: record.expires_at,

        warning:
          "Save your API key and secret now. The secret cannot be viewed again.",
      },
    });
  } catch (error) {
    console.error("API credential creation failed:", error);

    return res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to create API credentials",
      },
    });
  }
});

// ============================================================
// LIST API KEYS
// GET /v1/api-keys
// ============================================================
/**
 * @swagger
 * /v1/api-keys:
 *   get:
 *     summary: List API keys
 *     description: Returns the authenticated B2B client's API keys without exposing API secrets.
 *     tags:
 *       - API Keys
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: API keys retrieved successfully
 *       401:
 *         description: Authentication required
 *       403:
 *         description: B2B access required
 *       500:
 *         description: Internal server error
 */
router.get("/", async (req, res) => {
  try {
    const keys = await prisma.api_keys_new.findMany({
      where: {
        user_id: req.user.id,
      },
      orderBy: {
        created_at: "desc",
      },
      select: {
        id: true,
        name: true,
        is_active: true,
        created_at: true,
        expires_at: true,
      },
    });

    const data = keys.map((key) => ({
      id: key.id,
      name: key.name,

      // Never return hashes
      apiKey: null,
      apiSecret: null,

      isActive: key.is_active,
      createdAt: key.created_at,
      expiresAt: key.expires_at,

      status: key.is_active ? "ACTIVE" : "REVOKED",
    }));

    return res.json({
      success: true,
      count: data.length,
      activeCount: data.filter((key) => key.isActive).length,
      maxActiveKeys: MAX_ACTIVE_KEYS,
      data,
    });
  } catch (error) {
    console.error("Failed to fetch API keys:", error);

    return res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to fetch API keys",
      },
    });
  }
});

// ============================================================
// REVOKE / DEACTIVATE API KEY
// PATCH /v1/api-keys/:id/deactivate
// ============================================================
/**
 * @swagger
 * /v1/api-keys/{id}/deactivate:
 *   patch:
 *     summary: Deactivate an API key
 *     tags:
 *       - API Keys
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: API key ID
 *     responses:
 *       200:
 *         description: API key deactivated successfully
 *       401:
 *         description: Authentication required
 *       404:
 *         description: API key not found
 *       500:
 *         description: Internal server error
 */
router.patch("/:id/deactivate", async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: "INVALID_ID",
          message: "Invalid API key ID",
        },
      });
    }

    const existingKey = await prisma.api_keys_new.findFirst({
      where: {
        id,
        user_id: req.user.id,
      },
      select: {
        id: true,
        name: true,
        is_active: true,
      },
    });

    if (!existingKey) {
      return res.status(404).json({
        success: false,
        error: {
          code: "NOT_FOUND",
          message: "API key not found",
        },
      });
    }

    if (!existingKey.is_active) {
      return res.status(400).json({
        success: false,
        error: {
          code: "ALREADY_REVOKED",
          message: "API key is already revoked",
        },
      });
    }

    const updatedKey = await prisma.api_keys_new.update({
      where: {
        id,
      },
      data: {
        is_active: false,
      },
      select: {
        id: true,
        name: true,
        is_active: true,
        created_at: true,
        expires_at: true,
      },
    });

    return res.json({
      success: true,
      message: "API key revoked successfully",
      data: updatedKey,
    });
  } catch (error) {
    console.error("API key revocation failed:", error);

    return res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to revoke API key",
      },
    });
  }
});

// ============================================================
// REGENERATE SECRET
// POST /v1/api-keys/:id/regenerate-secret
// ============================================================

router.post("/:id/regenerate-secret", async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: "INVALID_ID",
          message: "Invalid API key ID",
        },
      });
    }

    const existingKey = await prisma.api_keys_new.findFirst({
      where: {
        id,
        user_id: req.user.id,
      },
      select: {
        id: true,
        name: true,
        is_active: true,
        expires_at: true,
      },
    });

    if (!existingKey) {
      return res.status(404).json({
        success: false,
        error: {
          code: "NOT_FOUND",
          message: "API key not found",
        },
      });
    }

    if (!existingKey.is_active) {
      return res.status(400).json({
        success: false,
        error: {
          code: "KEY_REVOKED",
          message:
            "Cannot regenerate the secret for a revoked API key",
        },
      });
    }

    // Generate new secret
    const newApiSecret = generateApiSecret();

    // Hash new secret
    const newSecretHash = await bcrypt.hash(
      newApiSecret,
      12
    );

    // Replace old secret hash
    await prisma.api_keys_new.update({
      where: {
        id,
      },
      data: {
        secret_hash: newSecretHash,
      },
    });

    return res.json({
      success: true,
      message:
        "API secret regenerated successfully. The previous secret is now invalid.",
      data: {
        id: existingKey.id,
        name: existingKey.name,
        apiSecret: newApiSecret,
        warning:
          "Save this new secret now. It will not be shown again.",
      },
    });
  } catch (error) {
    console.error(
      "API secret regeneration failed:",
      error
    );

    return res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to regenerate API secret",
      },
    });
  }
});

// ============================================================
// ACTIVATE API KEY
// PATCH /v1/api-keys/:id/activate
// ============================================================
/**
 * @swagger
 * /v1/api-keys/{id}/activate:
 *   patch:
 *     summary: Activate an API key
 *     tags:
 *       - API Keys
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: API key ID
 *     responses:
 *       200:
 *         description: API key activated successfully
 *       401:
 *         description: Authentication required
 *       404:
 *         description: API key not found
 *       500:
 *         description: Internal server error
 */
router.patch("/:id/activate", async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: "INVALID_ID",
          message: "Invalid API key ID",
        },
      });
    }

    const existingKey = await prisma.api_keys_new.findFirst({
      where: {
        id,
        user_id: req.user.id,
      },
      select: {
        id: true,
        name: true,
        is_active: true,
        expires_at: true,
      },
    });

    if (!existingKey) {
      return res.status(404).json({
        success: false,
        error: {
          code: "NOT_FOUND",
          message: "API key not found",
        },
      });
    }

    if (existingKey.is_active) {
      return res.status(400).json({
        success: false,
        error: {
          code: "ALREADY_ACTIVE",
          message: "API key is already active",
        },
      });
    }

    // Check expiry
    if (
      existingKey.expires_at &&
      existingKey.expires_at <= new Date()
    ) {
      return res.status(400).json({
        success: false,
        error: {
          code: "KEY_EXPIRED",
          message:
            "This API key has expired and cannot be activated",
        },
      });
    }

    // Check maximum active keys
    const activeKeyCount = await prisma.api_keys_new.count({
      where: {
        user_id: req.user.id,
        is_active: true,
      },
    });

    if (activeKeyCount >= MAX_ACTIVE_KEYS) {
      return res.status(400).json({
        success: false,
        error: {
          code: "MAX_ACTIVE_KEYS",
          message:
            `You can have a maximum of ${MAX_ACTIVE_KEYS} active API keys`,
        },
      });
    }

    const updatedKey = await prisma.api_keys_new.update({
      where: {
        id,
      },
      data: {
        is_active: true,
      },
      select: {
        id: true,
        name: true,
        is_active: true,
        created_at: true,
        expires_at: true,
      },
    });

    return res.json({
      success: true,
      message: "API key activated successfully",
      data: updatedKey,
    });
  } catch (error) {
    console.error(
      "API key activation failed:",
      error
    );

    return res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to activate API key",
      },
    });
  }
});

module.exports = router;