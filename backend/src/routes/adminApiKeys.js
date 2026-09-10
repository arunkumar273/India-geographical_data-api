const express = require("express");
const prisma = require("../lib/prisma");
const adminAuth = require("../middleware/adminAuth");

const router = express.Router();

router.use(adminAuth);

/*
 * GET /v1/admin/users/:userId/api-keys
 * View all API keys belonging to a user
 */
router.get("/users/:userId/api-keys", async (req, res) => {
  try {
    const userId = Number(req.params.userId);

    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: "INVALID_USER_ID",
          message: "Invalid user ID"
        }
      });
    }

    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: "USER_NOT_FOUND",
          message: "User not found"
        }
      });
    }

    const apiKeys = await prisma.api_keys_new.findMany({
      where: {
        user_id: userId
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
      count: apiKeys.length,
      data: apiKeys
    });
  } catch (error) {
    console.error("Failed to fetch user API keys:", error);

    res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to fetch API keys"
      }
    });
  }
});


/*
 * PATCH /v1/admin/api-keys/:keyId/deactivate
 * Deactivate an API key
 */
router.patch("/api-keys/:keyId/deactivate", async (req, res) => {
  try {
    const keyId = Number(req.params.keyId);

    if (!Number.isInteger(keyId) || keyId <= 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: "INVALID_KEY_ID",
          message: "Invalid API key ID"
        }
      });
    }

    const apiKey = await prisma.api_keys_new.findUnique({
      where: {
        id: keyId
      }
    });

    if (!apiKey) {
      return res.status(404).json({
        success: false,
        error: {
          code: "API_KEY_NOT_FOUND",
          message: "API key not found"
        }
      });
    }

    if (!apiKey.is_active) {
      return res.status(409).json({
        success: false,
        error: {
          code: "API_KEY_ALREADY_INACTIVE",
          message: "API key is already inactive"
        }
      });
    }

    const updatedKey = await prisma.api_keys_new.update({
      where: {
        id: keyId
      },
      data: {
        is_active: false
      },
      select: {
        id: true,
        user_id: true,
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
    console.error("Failed to deactivate API key:", error);

    res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to deactivate API key"
      }
    });
  }
});


/*
 * PATCH /v1/admin/api-keys/:keyId/activate
 * Activate an API key
 */
router.patch("/api-keys/:keyId/activate", async (req, res) => {
  try {
    const keyId = Number(req.params.keyId);

    if (!Number.isInteger(keyId) || keyId <= 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: "INVALID_KEY_ID",
          message: "Invalid API key ID"
        }
      });
    }

    const apiKey = await prisma.api_keys_new.findUnique({
      where: {
        id: keyId
      }
    });

    if (!apiKey) {
      return res.status(404).json({
        success: false,
        error: {
          code: "API_KEY_NOT_FOUND",
          message: "API key not found"
        }
      });
    }

    const updatedKey = await prisma.api_keys_new.update({
      where: {
        id: keyId
      },
      data: {
        is_active: true
      },
      select: {
        id: true,
        user_id: true,
        name: true,
        is_active: true,
        created_at: true,
        expires_at: true
      }
    });

    res.json({
      success: true,
      message: "API key activated successfully",
      data: updatedKey
    });
  } catch (error) {
    console.error("Failed to activate API key:", error);

    res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to activate API key"
      }
    });
  }
});


/*
 * GET /v1/admin/api-keys
 * View all API keys
 */
router.get("/api-keys", async (req, res) => {
  try {
    const apiKeys = await prisma.api_keys_new.findMany({
      orderBy: {
        created_at: "desc"
      },
      select: {
        id: true,
        user_id: true,
        name: true,
        is_active: true,
        created_at: true,
        expires_at: true,
        user: {
          select: {
            email: true,
            name: true
          }
        }
      }
    });

    res.json({
      success: true,
      count: apiKeys.length,
      data: apiKeys
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

module.exports = router;