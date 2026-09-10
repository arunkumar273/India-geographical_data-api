const express = require("express");
const prisma = require("../lib/prisma");

const router = express.Router();

// GET /v1/states
router.get("/", async (req, res) => {
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