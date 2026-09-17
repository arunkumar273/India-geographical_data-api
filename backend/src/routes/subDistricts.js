const express = require("express");
const prisma = require("../lib/prisma");
const { requireStateAccess } = require("../middleware/stateAccess");

const router = express.Router();
/**
 * @swagger
 * /v1/districts/{districtId}/sub-districts:
 *   get:
 *     summary: Get sub-districts for a district
 *     description: Returns all sub-districts belonging to the specified district.
 *     tags:
 *       - Geography
 *     security:
 *       - ApiKeyAuth: []
 *         ApiSecretAuth: []
 *     parameters:
 *       - in: path
 *         name: districtId
 *         required: true
 *         schema:
 *           type: integer
 *         description: District ID
 *     responses:
 *       200:
 *         description: Sub-districts retrieved successfully
 *       400:
 *         description: Invalid district ID
 *       401:
 *         description: Invalid or missing API credentials
 *       429:
 *         description: Rate limit exceeded
 *       500:
 *         description: Internal server error
 */
router.get(
  "/districts/:districtId/subdistricts",
  requireStateAccess,
  async (req, res) => {
    try {
      const districtId = Number(req.params.districtId);

      if (!Number.isInteger(districtId) || districtId <= 0) {
        return res.status(400).json({
          success: false,
          error: {
            code: "INVALID_DISTRICT_ID",
            message: "Invalid district ID"
          }
        });
      }

      // Find district and its state
      const district = await prisma.districts.findUnique({
        where: {
          id: districtId
        },
        select: {
          id: true,
          district_name: true,
          state_id: true
        }
      });

      if (!district) {
        return res.status(404).json({
          success: false,
          error: {
            code: "DISTRICT_NOT_FOUND",
            message: "District not found"
          }
        });
      }

      // Check state access
      if (!req.allowedStateIds.includes(district.state_id)) {
        return res.status(403).json({
          success: false,
          error: {
            code: "STATE_ACCESS_DENIED",
            message: "You do not have access to this district"
          }
        });
      }

      const subDistricts = await prisma.sub_districts.findMany({
        where: {
          district_id: districtId
        },
        orderBy: {
          sub_district_name: "asc"
        },
        select: {
          id: true,
          sub_district_code: true,
          sub_district_name: true
        }
      });

      res.json({
        success: true,
        count: subDistricts.length,
        data: subDistricts
      });
    } catch (error) {
      console.error("Failed to fetch sub-districts:", error);

      res.status(500).json({
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to fetch sub-districts"
        }
      });
    }
  }
);

module.exports = router;