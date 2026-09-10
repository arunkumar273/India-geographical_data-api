const express = require("express");
const prisma = require("../lib/prisma");
const jwtAuth = require("../middleware/jwtAuth");

const router = express.Router();

router.use(jwtAuth);

// ==========================================
// GET ALL STATES FOR B2B DASHBOARD
// ==========================================
router.get("/", async (req, res) => {
  try {
    const states = await prisma.states.findMany({
      select: {
        id: true,
        state_code: true,
        state_name: true,
      },
      orderBy: {
        state_name: "asc",
      },
    });

    res.json({
      success: true,
      count: states.length,
      data: states,
    });
  } catch (error) {
    console.error("Failed to load dashboard states:", error);

    res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to load states",
      },
    });
  }
});

module.exports = router;