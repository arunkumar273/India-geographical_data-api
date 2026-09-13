const express = require("express");
const { PrismaClient } = require("@prisma/client");
const jwt = require("jsonwebtoken");

const router = express.Router();
const prisma = new PrismaClient();

/* ============================================================
   ADMIN AUTH
============================================================ */

function requireAdmin(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: "Admin authentication required"
        }
      });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.role !== "ADMIN") {
      return res.status(403).json({
        success: false,
        error: {
          code: "ADMIN_ONLY",
          message: "Administrator access required"
        }
      });
    }

    req.admin = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: {
        code: "INVALID_TOKEN",
        message: "Invalid or expired admin token"
      }
    });
  }
}

router.use(requireAdmin);

/* ============================================================
   GET ALL STATES
   GET /v1/admin/states
============================================================ */

router.get("/states", async (req, res) => {
  try {
    const states = await prisma.states.findMany({
      select: {
        id: true,
        state_code: true,
        state_name: true
      },
      orderBy: {
        state_name: "asc"
      }
    });

    return res.json({
      success: true,
      count: states.length,
      data: states
    });
  } catch (error) {
    console.error("Failed to fetch states:", error);

    return res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to fetch states"
      }
    });
  }
});

/* ============================================================
   GET USER STATE ACCESS
   GET /v1/admin/users/:userId/states
============================================================ */

router.get("/users/:userId/states", async (req, res) => {
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
        role: true,
        approval_status: true,
        plan: {
          select: {
            id: true,
            code: true,
            name: true
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

    const assignments = await prisma.user_state_access.findMany({
      where: {
        user_id: userId
      },
      select: {
        id: true,
        user_id: true,
        state_id: true,
        state: {
          select: {
            id: true,
            state_code: true,
            state_name: true
          }
        }
      },
      orderBy: {
        state_id: "asc"
      }
    });

    return res.json({
      success: true,
      data: {
        user,
        states: assignments.map((assignment) => ({
          assignmentId: assignment.id,
          userId: assignment.user_id,
          stateId: assignment.state_id,
          stateCode: assignment.state?.state_code ?? null,
          stateName: assignment.state?.state_name ?? `State ${assignment.state_id}`
        }))
      }
    });
  } catch (error) {
    console.error("Failed to fetch user state access:", error);

    return res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to fetch user state access"
      }
    });
  }
});

/* ============================================================
   ASSIGN STATE
   POST /v1/admin/users/:userId/states
============================================================ */

router.post(
  "/users/:userId/states",
  async (req, res) => {
    try {
      const userId = Number(req.params.userId);
      const stateId = Number(req.body.stateId);

      if (!Number.isInteger(userId) || userId <= 0) {
        return res.status(400).json({
          success: false,
          error: {
            code: "INVALID_USER_ID",
            message: "Invalid user ID",
          },
        });
      }

      if (!Number.isInteger(stateId) || stateId <= 0) {
        return res.status(400).json({
          success: false,
          error: {
            code: "INVALID_STATE_ID",
            message: "Invalid state ID",
          },
        });
      }

      // Verify user
      const user = await prisma.users.findUnique({
        where: {
          id: userId,
        },
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          error: {
            code: "USER_NOT_FOUND",
            message: "User not found",
          },
        });
      }

      if (user.role !== "B2B") {
        return res.status(400).json({
          success: false,
          error: {
            code: "INVALID_USER_ROLE",
            message:
              "State access can only be assigned to B2B users",
          },
        });
      }

      // Verify state
      const state = await prisma.states.findUnique({
        where: {
          id: stateId,
        },
      });

      if (!state) {
        return res.status(404).json({
          success: false,
          error: {
            code: "STATE_NOT_FOUND",
            message: "State not found",
          },
        });
      }

      // Check duplicate assignment
      const existing =
        await prisma.user_state_access.findFirst({
          where: {
            user_id: userId,
            state_id: stateId,
          },
        });

      if (existing) {
        return res.status(409).json({
          success: false,
          error: {
            code: "STATE_ACCESS_EXISTS",
            message:
              "This state is already assigned to the user",
          },
        });
      }

      // Create assignment
      const assignment =
        await prisma.user_state_access.create({
          data: {
            user_id: userId,
            state_id: stateId,
          },
          include: {
            state: true,
          },
        });

      return res.status(201).json({
        success: true,
        message: "State access assigned successfully",
        data: {
          assignmentId: assignment.id,
          userId: assignment.user_id,
          stateId: assignment.state_id,
          stateCode:
            assignment.state?.state_code ?? null,
          stateName:
            assignment.state?.state_name ??
            `State ${assignment.state_id}`,
        },
      });
    } catch (error) {
      console.error(
        "Failed to assign state access:",
        error
      );

      return res.status(500).json({
        success: false,
        error: {
          code: "STATE_ACCESS_ASSIGNMENT_FAILED",
          message:
            "Failed to assign state access",
        },
      });
    }
  }
);
/* ============================================================
   REMOVE STATE ACCESS
   DELETE /v1/admin/users/:userId/states/:assignmentId
============================================================ */

router.delete(
  "/users/:userId/states/:assignmentId",
  async (req, res) => {
    try {
      const userId = Number(req.params.userId);
      const assignmentId = Number(
        req.params.assignmentId
      );

      if (
        !Number.isInteger(userId) ||
        userId <= 0
      ) {
        return res.status(400).json({
          success: false,
          error: {
            code: "INVALID_USER_ID",
            message: "Invalid user ID",
          },
        });
      }

      if (
        !Number.isInteger(assignmentId) ||
        assignmentId <= 0
      ) {
        return res.status(400).json({
          success: false,
          error: {
            code: "INVALID_ASSIGNMENT_ID",
            message: "Invalid assignment ID",
          },
        });
      }

      const assignment =
        await prisma.user_state_access.findFirst({
          where: {
            id: assignmentId,
            user_id: userId,
          },
        });

      if (!assignment) {
        return res.status(404).json({
          success: false,
          error: {
            code: "STATE_ACCESS_NOT_FOUND",
            message:
              "State access assignment not found",
          },
        });
      }

      await prisma.user_state_access.delete({
        where: {
          id: assignment.id,
        },
      });

      return res.json({
        success: true,
        message:
          "State access removed successfully",
      });
    } catch (error) {
      console.error(
        "Failed to remove state access:",
        error
      );

      return res.status(500).json({
        success: false,
        error: {
          code: "STATE_ACCESS_REMOVAL_FAILED",
          message:
            "Failed to remove state access",
        },
      });
    }
  }
);
module.exports = router;