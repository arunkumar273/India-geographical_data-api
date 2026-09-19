const express = require("express");
const prisma = require("../lib/prisma");
const {
  getCache,
  setCache,
} = require("../lib/cache");

const router = express.Router();

// GET /v1/states
/**
 * @swagger
 * /v1/states:
 *   get:
 *     summary: Get all states and union territories
 *     description: Returns the complete list of Indian states and union territories.
 *     tags:
 *       - Geography
 *     security:
 *       - ApiKeyAuth: []
 *         ApiSecretAuth: []
 *     responses:
 *       200:
 *         description: States retrieved successfully
 *       401:
 *         description: Invalid or missing API credentials
 *       429:
 *         description: Rate limit exceeded
 *       500:
 *         description: Internal server error
 */
router.get("/", async (req, res) => {
  try {
    const cacheKey = "geo:states";

    // Check Redis cache first
    const cachedStates = await getCache(cacheKey);

    if (cachedStates) {
      return res.json({
        success: true,
        count: cachedStates.length,
        data: cachedStates,
        meta: {
          cached: true,
        },
      });
    }

    // Cache miss - fetch from PostgreSQL
    const states = await prisma.states.findMany({
      orderBy: {
        state_name: "asc",
      },
      select: {
        id: true,
        state_code: true,
        state_name: true,
      },
    });

    // Store result in Redis for 1 hour
    await setCache(cacheKey, states, 3600);

    return res.json({
      success: true,
      count: states.length,
      data: states,
      meta: {
        cached: false,
      },
    });
  } catch (error) {
    console.error("Failed to fetch states:", error);

    return res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to fetch states",
      },
    });
  }
});

module.exports = router;