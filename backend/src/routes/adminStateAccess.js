const express = require("express");
const prisma = require("../lib/prisma");
const adminAuth = require("../middleware/adminAuth");

const router = express.Router();

router.use(adminAuth);

/*
 * GET /v1/admin/users/:userId/states
 * View states assigned to a user
 */
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

    const access = await prisma.user_state_access.findMany({
      where: {
        user_id: userId
      },
      orderBy: {
        state: {
          state_name: "asc"
        }
      },
      select: {
        id: true,
        created_at: true,
        state: {
          select: {
            id: true,
            state_code: true,
            state_name: true
          }
        }
      }
    });

    res.json({
      success: true,
      user,
      count: access.length,
      data: access
    });
  } catch (error) {
    console.error("Failed to fetch user state access:", error);

    res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to fetch state access"
      }
    });
  }
});


/*
 * POST /v1/admin/users/:userId/states
 * Assign a state to a user
 */
router.post("/users/:userId/states", async (req, res) => {
  try {
    const userId = Number(req.params.userId);
    const stateId = Number(req.body.stateId);

    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: "INVALID_USER_ID",
          message: "Invalid user ID"
        }
      });
    }

    if (!Number.isInteger(stateId) || stateId <= 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: "INVALID_STATE_ID",
          message: "Invalid state ID"
        }
      });
    }

    const user = await prisma.users.findUnique({
      where: { id: userId }
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

    if (user.role === "ADMIN") {
      return res.status(400).json({
        success: false,
        error: {
          code: "INVALID_OPERATION",
          message: "State access is only applicable to B2B users"
        }
      });
    }

    const state = await prisma.states.findUnique({
      where: {
        id: stateId
      }
    });

    if (!state) {
      return res.status(404).json({
        success: false,
        error: {
          code: "STATE_NOT_FOUND",
          message: "State not found"
        }
      });
    }

    const existingAccess = await prisma.user_state_access.findUnique({
      where: {
        user_id_state_id: {
          user_id: userId,
          state_id: stateId
        }
      }
    });

    if (existingAccess) {
      return res.status(409).json({
        success: false,
        error: {
          code: "STATE_ALREADY_ASSIGNED",
          message: "This state is already assigned to the user"
        }
      });
    }

    const access = await prisma.user_state_access.create({
      data: {
        user_id: userId,
        state_id: stateId
      },
      select: {
        id: true,
        created_at: true,
        state: {
          select: {
            id: true,
            state_code: true,
            state_name: true
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      message: "State assigned successfully",
      data: access
    });
  } catch (error) {
    console.error("Failed to assign state:", error);

    res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to assign state"
      }
    });
  }
});


/*
 * DELETE /v1/admin/users/:userId/states/:stateId
 * Remove state access from a user
 */
router.delete("/users/:userId/states/:stateId", async (req, res) => {
  try {
    const userId = Number(req.params.userId);
    const stateId = Number(req.params.stateId);

    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: "INVALID_USER_ID",
          message: "Invalid user ID"
        }
      });
    }

    if (!Number.isInteger(stateId) || stateId <= 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: "INVALID_STATE_ID",
          message: "Invalid state ID"
        }
      });
    }

    const access = await prisma.user_state_access.findUnique({
      where: {
        user_id_state_id: {
          user_id: userId,
          state_id: stateId
        }
      }
    });

    if (!access) {
      return res.status(404).json({
        success: false,
        error: {
          code: "STATE_ACCESS_NOT_FOUND",
          message: "State access assignment not found"
        }
      });
    }

    await prisma.user_state_access.delete({
      where: {
        user_id_state_id: {
          user_id: userId,
          state_id: stateId
        }
      }
    });

    res.json({
      success: true,
      message: "State access removed successfully"
    });
  } catch (error) {
    console.error("Failed to remove state access:", error);

    res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to remove state access"
      }
    });
  }
});


/*
 * GET /v1/admin/states
 * List all states for admin assignment UI
 */
router.get("/states", async (req, res) => {
  try {
    const states = await prisma.states.findMany({
      orderBy: {
        state_name: "asc"
      },
      select: {
        id: true,
        state_code: true,
        state_name: true
      }
    });

    res.json({
      success: true,
      count: states.length,
      data: states
    });
  } catch (error) {
    console.error("Failed to fetch states:", error);

    res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to fetch states"
      }
    });
  }
});

module.exports = router;