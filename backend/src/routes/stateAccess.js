const express = require("express");
const prisma = require("../lib/prisma");
const jwtAuth = require("../middleware/jwtAuth");

const router = express.Router();

// All State Access dashboard operations use JWT authentication.
// API Key + API Secret are NOT required here.
router.use(jwtAuth);

// ==========================================
// GET ASSIGNED STATES
// ==========================================
router.get("/", async (req, res) => {
  try {
    const access = await prisma.user_state_access.findMany({
      where: {
        user_id: req.user.id,
      },
      include: {
        state: {
          select: {
            id: true,
            state_code: true,
            state_name: true,
          },
        },
      },
      orderBy: {
        created_at: "asc",
      },
    });

    res.json({
      success: true,
      count: access.length,
      data: access,
    });
  } catch (error) {
    console.error("Failed to get state access:", error);

    res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to load state access",
      },
    });
  }
});

// ==========================================
// ADD STATE ACCESS
// ==========================================
router.post("/", async (req, res) => {
  try {
    const stateId = Number(req.body.stateId);

    if (!Number.isInteger(stateId) || stateId <= 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "A valid stateId is required",
        },
      });
    }

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

    const existingAccess =
      await prisma.user_state_access.findUnique({
        where: {
          user_id_state_id: {
            user_id: req.user.id,
            state_id: stateId,
          },
        },
      });

    if (existingAccess) {
      return res.status(409).json({
        success: false,
        error: {
          code: "STATE_ACCESS_EXISTS",
          message: "State access already exists",
        },
      });
    }

    const access =
      await prisma.user_state_access.create({
        data: {
          user_id: req.user.id,
          state_id: stateId,
        },
        include: {
          state: {
            select: {
              id: true,
              state_code: true,
              state_name: true,
            },
          },
        },
      });

    res.status(201).json({
      success: true,
      message: "State access assigned successfully",
      data: access,
    });
  } catch (error) {
    console.error("Failed to assign state access:", error);

    res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to assign state access",
      },
    });
  }
});

// ==========================================
// REMOVE STATE ACCESS
// ==========================================
router.delete("/:stateId", async (req, res) => {
  try {
    const stateId = Number(req.params.stateId);

    if (!Number.isInteger(stateId) || stateId <= 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid state ID",
        },
      });
    }

    const existingAccess =
      await prisma.user_state_access.findUnique({
        where: {
          user_id_state_id: {
            user_id: req.user.id,
            state_id: stateId,
          },
        },
      });

    if (!existingAccess) {
      return res.status(404).json({
        success: false,
        error: {
          code: "STATE_ACCESS_NOT_FOUND",
          message: "State access not found",
        },
      });
    }

    await prisma.user_state_access.delete({
      where: {
        user_id_state_id: {
          user_id: req.user.id,
          state_id: stateId,
        },
      },
    });

    res.json({
      success: true,
      message: "State access removed successfully",
    });
  } catch (error) {
    console.error("Failed to remove state access:", error);

    res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to remove state access",
      },
    });
  }
});

module.exports = router;