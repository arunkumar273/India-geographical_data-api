const express = require("express");
const prisma = require("../lib/prisma");
const { requireStateAccess } = require("../middleware/stateAccess");

const router = express.Router();

router.get(
  "/subdistricts/:subDistrictId/villages",
  requireStateAccess,
  async (req, res) => {
    try {
      const subDistrictId = Number(req.params.subDistrictId);

      const page = Number(req.query.page || 1);
      const limit = Number(req.query.limit || 100);

      if (!Number.isInteger(subDistrictId) || subDistrictId <= 0) {
        return res.status(400).json({
          success: false,
          error: {
            code: "INVALID_SUBDISTRICT_ID",
            message: "Invalid sub-district ID"
          }
        });
      }

      if (!Number.isInteger(page) || page < 1) {
        return res.status(400).json({
          success: false,
          error: {
            code: "INVALID_PAGE",
            message: "Page must be greater than or equal to 1"
          }
        });
      }

      if (!Number.isInteger(limit) || limit < 1 || limit > 10000) {
        return res.status(400).json({
          success: false,
          error: {
            code: "INVALID_LIMIT",
            message: "Limit must be between 1 and 10000"
          }
        });
      }

      // Find sub-district and determine its state
      const subDistrict = await prisma.sub_districts.findUnique({
        where: {
          id: subDistrictId
        },
        select: {
          id: true,
          sub_district_name: true,
          districts: {
            select: {
              id: true,
              district_name: true,
              state_id: true
            }
          }
        }
      });

      if (!subDistrict) {
        return res.status(404).json({
          success: false,
          error: {
            code: "SUBDISTRICT_NOT_FOUND",
            message: "Sub-district not found"
          }
        });
      }

      const stateId = subDistrict.districts.state_id;

      // Check state access
      if (!req.allowedStateIds.includes(stateId)) {
        return res.status(403).json({
          success: false,
          error: {
            code: "STATE_ACCESS_DENIED",
            message: "You do not have access to this sub-district"
          }
        });
      }

      const skip = (page - 1) * limit;

      const [villages, total] = await Promise.all([
        prisma.villages.findMany({
          where: {
            sub_district_id: subDistrictId
          },
          orderBy: {
            village_name: "asc"
          },
          skip,
          take: limit,
          select: {
            id: true,
            village_code: true,
            village_name: true
          }
        }),

        prisma.villages.count({
          where: {
            sub_district_id: subDistrictId
          }
        })
      ]);

      const data = villages.map((village) => ({
        id: village.id.toString(),
        villageCode: village.village_code,
        villageName: village.village_name
      }));

      res.json({
        success: true,
        count: data.length,
        total,
        page,
        limit,
        data
      });
    } catch (error) {
      console.error("Failed to fetch villages:", error);

      res.status(500).json({
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to fetch villages"
        }
      });
    }
  }
);

module.exports = router;