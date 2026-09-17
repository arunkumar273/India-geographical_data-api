const express = require("express");
const prisma = require("../lib/prisma");
const adminAuth = require("../middleware/adminAuth");

const router = express.Router();
/**
 * @swagger
 * /v1/admin/users:
 *   get:
 *     summary: List B2B users
 *     description: Returns B2B client accounts and their account information.
 *     tags:
 *       - Admin
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Users retrieved successfully
 *       401:
 *         description: Admin authentication required
 *       403:
 *         description: Admin access required
 *       500:
 *         description: Internal server error
 */
router.use(adminAuth);

// ============================================================
// Helper: return safe user information
// ============================================================

function formatUser(user) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    businessName: user.business_name,
    gstNumber: user.gst_number,
    phoneNumber: user.phone_number,
    role: user.role,
    approvalStatus: user.approval_status,
    isActive: user.is_active,
    planId: user.plan_id,
    approvedAt: user.approved_at,
    rejectedAt: user.rejected_at,
    rejectionReason: user.rejection_reason,
    createdAt: user.created_at,
    updatedAt: user.updated_at
  };
}

// ============================================================
// GET /v1/admin/users
// List B2B users
// ============================================================

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
        business_name: true,
        gst_number: true,
        phone_number: true,
        role: true,
        approval_status: true,
        is_active: true,
        plan_id: true,
        approved_at: true,
        rejected_at: true,
        rejection_reason: true,
        created_at: true,
        updated_at: true,

        plan: {
          select: {
            id: true,
            code: true,
            name: true,
            daily_request_limit: true,
            burst_limit: true
          }
        },

        _count: {
          select: {
            api_keys_new: true,
            state_access: true,
            api_logs: true
          }
        }
      }
    });

    const data = users.map((user) => ({
      ...formatUser(user),
      plan: user.plan,
      apiKeyCount: user._count.api_keys_new,
      assignedStateCount: user._count.state_access,
      requestCount: user._count.api_logs
    }));

    return res.json({
      success: true,
      count: data.length,
      data
    });
  } catch (error) {
    console.error("Failed to fetch admin users:", error);

    return res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to fetch users"
      }
    });
  }
});

// ============================================================
// GET /v1/admin/users/pending
// List pending B2B registrations
// ============================================================
/**
 * @swagger
 * /v1/admin/users/pending:
 *   get:
 *     summary: List pending B2B users
 *     description: Returns B2B accounts waiting for administrator approval.
 *     tags:
 *       - Admin
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Pending users retrieved successfully
 *       401:
 *         description: Admin authentication required
 *       403:
 *         description: Admin access required
 *       500:
 *         description: Internal server error
 */
router.get("/pending", async (req, res) => {
  try {
    const users = await prisma.users.findMany({
      where: {
        role: "B2B",
        approval_status: "PENDING_APPROVAL"
      },
      orderBy: {
        created_at: "asc"
      },
      select: {
        id: true,
        email: true,
        name: true,
        business_name: true,
        gst_number: true,
        phone_number: true,
        role: true,
        approval_status: true,
        is_active: true,
        plan_id: true,
        created_at: true,
        updated_at: true
      }
    });

    return res.json({
      success: true,
      count: users.length,
      data: users.map(formatUser)
    });
  } catch (error) {
    console.error("Failed to fetch pending users:", error);

    return res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to fetch pending users"
      }
    });
  }
});

// ============================================================
// GET /v1/admin/users/:userId
// Get one B2B user
// ============================================================
/**
 * @swagger
 * /v1/admin/users/{userId}:
 *   get:
 *     summary: Get B2B user details
 *     tags:
 *       - Admin
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: B2B user ID
 *     responses:
 *       200:
 *         description: User details retrieved successfully
 *       401:
 *         description: Admin authentication required
 *       403:
 *         description: Admin access required
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
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
        business_name: true,
        gst_number: true,
        phone_number: true,
        role: true,
        approval_status: true,
        is_active: true,
        plan_id: true,
        approved_at: true,
        rejected_at: true,
        rejection_reason: true,
        created_at: true,
        updated_at: true,

        plan: {
          select: {
            id: true,
            code: true,
            name: true,
            price_monthly: true,
            daily_request_limit: true,
            burst_limit: true,
            state_limit: true
          }
        },

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
        },

        api_logs: {
          select: {
            id: true,
            endpoint: true,
            method: true,
            status_code: true,
            response_time: true,
            ip_address: true,
            created_at: true
          },
          orderBy: {
            created_at: "desc"
          },
          take: 50
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

    return res.json({
      success: true,
      data: {
        ...formatUser(user),
        plan: user.plan,
        apiKeys: user.api_keys_new,
        states: user.state_access.map((item) => item.state),
        requestHistory: user.api_logs.map((log) => ({
          id: log.id.toString(),
          endpoint: log.endpoint,
          method: log.method,
          statusCode: log.status_code,
          responseTimeMs: log.response_time,
          ipAddress: log.ip_address,
          createdAt: log.created_at
        }))
      }
    });
  } catch (error) {
    console.error("Failed to fetch user:", error);

    return res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to fetch user"
      }
    });
  }
});

// ============================================================
// PATCH /v1/admin/users/:userId/approve
// Approve pending B2B user
// ============================================================

router.patch("/:userId/approve", async (req, res) => {
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
          message: "Administrator accounts cannot be approved using this endpoint"
        }
      });
    }

    if (existingUser.approval_status === "APPROVED") {
      return res.status(400).json({
        success: false,
        error: {
          code: "ALREADY_APPROVED",
          message: "User is already approved"
        }
      });
    }

    const user = await prisma.users.update({
      where: {
        id: userId
      },
      data: {
        approval_status: "APPROVED",
        is_active: true,
        approved_at: new Date(),
        rejected_at: null,
        rejection_reason: null
      },
      select: {
        id: true,
        email: true,
        name: true,
        business_name: true,
        role: true,
        approval_status: true,
        is_active: true,
        plan_id: true,
        approved_at: true
      }
    });

    return res.json({
      success: true,
      message: "User approved successfully",
      data: formatUser(user)
    });
  } catch (error) {
    console.error("Failed to approve user:", error);

    return res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to approve user"
      }
    });
  }
});

// ============================================================
// PATCH /v1/admin/users/:userId/reject
// Reject B2B user
// ============================================================

router.patch("/:userId/reject", async (req, res) => {
  try {
    const userId = Number(req.params.userId);
    const { reason } = req.body;

    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: "INVALID_USER_ID",
          message: "Invalid user ID"
        }
      });
    }

    if (!reason || !reason.trim()) {
      return res.status(400).json({
        success: false,
        error: {
          code: "REJECTION_REASON_REQUIRED",
          message: "A rejection reason is required"
        }
      });
    }

    const rejectionReason = reason.trim();

    if (rejectionReason.length > 500) {
      return res.status(400).json({
        success: false,
        error: {
          code: "REJECTION_REASON_TOO_LONG",
          message: "Rejection reason cannot exceed 500 characters"
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
          message: "Administrator accounts cannot be rejected"
        }
      });
    }

    if (existingUser.approval_status === "REJECTED") {
      return res.status(400).json({
        success: false,
        error: {
          code: "ALREADY_REJECTED",
          message: "User is already rejected"
        }
      });
    }

    const user = await prisma.users.update({
      where: {
        id: userId
      },
      data: {
        approval_status: "REJECTED",
        is_active: false,
        rejected_at: new Date(),
        rejection_reason: rejectionReason,
        approved_at: null
      },
      select: {
        id: true,
        email: true,
        name: true,
        business_name: true,
        role: true,
        approval_status: true,
        is_active: true,
        plan_id: true,
        rejected_at: true,
        rejection_reason: true
      }
    });

    return res.json({
      success: true,
      message: "User rejected successfully",
      data: formatUser(user)
    });
  } catch (error) {
    console.error("Failed to reject user:", error);

    return res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to reject user"
      }
    });
  }
});

// ============================================================
// PATCH /v1/admin/users/:userId/status
// Activate / deactivate B2B user
// ============================================================

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
          message:
            "Administrator accounts cannot be changed using this endpoint"
        }
      });
    }

    // Pending users cannot be activated manually.
    // They must first be approved.
    if (
      isActive &&
      existingUser.approval_status !== "APPROVED"
    ) {
      return res.status(400).json({
        success: false,
        error: {
          code: "APPROVAL_REQUIRED",
          message:
            "User must be approved before the account can be activated"
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
        approval_status: true,
        is_active: true
      }
    });

    return res.json({
      success: true,
      message: isActive
        ? "User activated successfully"
        : "User deactivated successfully",
      data: user
    });
  } catch (error) {
    console.error("Failed to update user status:", error);

    return res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to update user status"
      }
    });
  }
});

// ============================================================
// PATCH /v1/admin/users/:userId/plan
// Change B2B user's subscription plan
// ============================================================

router.patch("/:userId/plan", async (req, res) => {
  try {
    const userId = Number(req.params.userId);
    const { planId } = req.body;

    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: "INVALID_USER_ID",
          message: "Invalid user ID"
        }
      });
    }

    if (!Number.isInteger(Number(planId)) || Number(planId) <= 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: "INVALID_PLAN_ID",
          message: "A valid plan ID is required"
        }
      });
    }

    const numericPlanId = Number(planId);

    const existingUser = await prisma.users.findUnique({
      where: {
        id: userId
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        approval_status: true,
        is_active: true,
        plan_id: true
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

    if (existingUser.role !== "B2B") {
      return res.status(403).json({
        success: false,
        error: {
          code: "ACCESS_DENIED",
          message: "Only B2B users can have subscription plans"
        }
      });
    }

    const plan = await prisma.plans.findUnique({
      where: {
        id: numericPlanId
      },
      select: {
        id: true,
        code: true,
        name: true,
        price_monthly: true,
        daily_request_limit: true,
        burst_limit: true,
        state_limit: true,
        is_active: true
      }
    });

    if (!plan) {
      return res.status(404).json({
        success: false,
        error: {
          code: "PLAN_NOT_FOUND",
          message: "Plan not found"
        }
      });
    }

    if (!plan.is_active) {
      return res.status(400).json({
        success: false,
        error: {
          code: "PLAN_INACTIVE",
          message: "The selected plan is inactive"
        }
      });
    }

    if (existingUser.plan_id === numericPlanId) {
      return res.status(400).json({
        success: false,
        error: {
          code: "ALREADY_ASSIGNED",
          message: "User already has this plan"
        }
      });
    }

    const updatedUser = await prisma.users.update({
      where: {
        id: userId
      },
      data: {
        plan_id: numericPlanId
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        approval_status: true,
        is_active: true,
        plan_id: true,
        plan: {
          select: {
            id: true,
            code: true,
            name: true,
            price_monthly: true,
            daily_request_limit: true,
            burst_limit: true,
            state_limit: true
          }
        }
      }
    });

    return res.json({
      success: true,
      message: "User plan updated successfully",
      data: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        role: updatedUser.role,
        approvalStatus: updatedUser.approval_status,
        isActive: updatedUser.is_active,
        planId: updatedUser.plan_id,
        plan: updatedUser.plan
      }
    });
  } catch (error) {
    console.error("Failed to update user plan:", error);

    return res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to update user plan"
      }
    });
  }
});

module.exports = router;