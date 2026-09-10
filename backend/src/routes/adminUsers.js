const express = require("express");
const prisma = require("../lib/prisma");
const adminAuth = require("../middleware/adminAuth");

const router = express.Router();

router.use(adminAuth);

/*
 * GET /v1/admin/users
 * List B2B users
 */
router.get("/", async (req, res) => {
  try {
    const users = await prisma.users.findMany({
      where: {
        role: "B2B"
      },
      orderBy: {
        created_at: "desc"
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        is_active: true,
        created_at: true,
        updated_at: true,
        _count: {
          select: {
            api_keys_new: true,
            state_access: true
          }
        }
      }
    });

    const data = users.map((user) => ({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      isActive: user.is_active,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
      apiKeyCount: user._count.api_keys_new,
      assignedStateCount: user._count.state_access
    }));

    res.json({
      success: true,
      count: data.length,
      data
    });
  } catch (error) {
    console.error("Failed to fetch admin users:", error);

    res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to fetch users"
      }
    });
  }
});


/*
 * GET /v1/admin/users/:userId
 * Get one B2B user
 */
router.get("/:userId", async (req, res) => {
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
      where: {
        id: userId
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        is_active: true,
        created_at: true,
        updated_at: true,

        api_keys_new: {
          select: {
            id: true,
            name: true,
            is_active: true,
            created_at: true,
            expires_at: true
          },
          orderBy: {
            created_at: "desc"
          }
        },

        state_access: {
          select: {
            state: {
              select: {
                id: true,
                state_code: true,
                state_name: true
              }
            }
          }
        }
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

    res.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        isActive: user.is_active,
        createdAt: user.created_at,
        updatedAt: user.updated_at,

        apiKeys: user.api_keys_new,

        states: user.state_access.map((item) => item.state)
      }
    });
  } catch (error) {
    console.error("Failed to fetch user:", error);

    res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to fetch user"
      }
    });
  }
});


/*
 * PATCH /v1/admin/users/:userId/status
 * Activate / deactivate B2B user
 */
router.patch("/:userId/status", async (req, res) => {
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

    const { isActive } = req.body;

    if (typeof isActive !== "boolean") {
      return res.status(400).json({
        success: false,
        error: {
          code: "INVALID_STATUS",
          message: "isActive must be true or false"
        }
      });
    }

    const existingUser = await prisma.users.findUnique({
      where: {
        id: userId
      }
    });

    if (!existingUser) {
      return res.status(404).json({
        success: false,
        error: {
          code: "USER_NOT_FOUND",
          message: "User not found"
        }
      });
    }

    if (existingUser.role === "ADMIN") {
      return res.status(403).json({
        success: false,
        error: {
          code: "ADMIN_PROTECTED",
          message: "Administrator accounts cannot be changed using this endpoint"
        }
      });
    }

    const user = await prisma.users.update({
      where: {
        id: userId
      },
      data: {
        is_active: isActive
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        is_active: true
      }
    });

    res.json({
      success: true,
      message: isActive
        ? "User activated successfully"
        : "User deactivated successfully",
      data: user
    });
  } catch (error) {
    console.error("Failed to update user status:", error);

    res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to update user status"
      }
    });
  }
});

module.exports = router;