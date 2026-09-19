const express = require("express");
const prisma = require("../lib/prisma");
const { requireStateAccess } = require("../middleware/stateAccess");
const { getCache, setCache } = require("../lib/cache");

const router = express.Router();

/**
 * @swagger
 * /v1/states/{stateId}/districts:
 *   get:
 *     summary: Get districts for a state
 *     description: Returns all districts belonging to the specified state.
 *     tags:
 *       - Geography
 *     security:
 *       - ApiKeyAuth: []
 *         ApiSecretAuth: []
 *     parameters:
 *       - in: path
 *         name: stateId
 *         required: true
 *         schema:
 *           type: integer
 *         description: State ID
 *     responses:
 *       200:
 *         description: Districts retrieved successfully
 *       400:
 *         description: Invalid state ID
 *       401:
 *         description: Invalid or missing API credentials
 *       403:
 *         description: State access denied
 *       404:
 *         description: State not found
 *       429:
 *         description: Rate limit exceeded
 *       500:
 *         description: Internal server error
 */
router.get(
  "/states/:stateId/districts",
  requireStateAccess,
  async (req, res) => {
    try {
      const stateId = Number(req.params.stateId);

      if (!Number.isInteger(stateId) || stateId <= 0) {
        return res.status(400).json({
          success: false,
          error: {
            code: "INVALID_STATE_ID",
            message: "Invalid state ID",
          },
        });
      }

      // Check whether the user has access to this state
      if (!req.allowedStateIds.includes(stateId)) {
        return res.status(403).json({
          success: false,
          error: {
            code: "STATE_ACCESS_DENIED",
            message: "You do not have access to this state",
          },
        });
      }

      // Verify that the state exists
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

      // Redis cache key is specific to the state
      const cacheKey = `geo:districts:state:${stateId}`;

      // Check Redis cache
      const cachedDistricts = await getCache(cacheKey);

      if (cachedDistricts) {
        return res.json({
          success: true,
          count: cachedDistricts.length,
          data: cachedDistricts,
          meta: {
            cached: true,
          },
        });
      }

      // Cache miss - fetch from PostgreSQL
      const districts = await prisma.districts.findMany({
        where: {
          state_id: stateId,
        },
        orderBy: {
          district_name: "asc",
        },
        select: {
          id: true,
          district_code: true,
          district_name: true,
        },
      });

      // Store in Redis for 1 hour
      await setCache(cacheKey, districts, 3600);

      return res.json({
        success: true,
        count: districts.length,
        data: districts,
        meta: {
          cached: false,
        },
      });
    } catch (error) {
      console.error("Failed to fetch districts:", error);

      return res.status(500).json({
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to fetch districts",
        },
      });
    }
  }
);

module.exports = router;