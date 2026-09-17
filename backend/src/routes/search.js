const express = require("express");
const prisma = require("../lib/prisma");
const { requireStateAccess } = require("../middleware/stateAccess");

const router = express.Router();
/**
 * @swagger
 * /v1/search:
 *   get:
 *     summary: Search villages
 *     description: Search Indian villages using a text query and return the complete geographical hierarchy.
 *     tags:
 *       - Search
 *     security:
 *       - ApiKeyAuth: []
 *         ApiSecretAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Village or area search text
 *       - in: query
 *         name: limit
 *         required: false
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Maximum number of results
 *     responses:
 *       200:
 *         description: Search results retrieved successfully
 *       400:
 *         description: Invalid search request
 *       401:
 *         description: Invalid or missing API credentials
 *       429:
 *         description: Rate limit exceeded
 *       500:
 *         description: Internal server error
 */
router.get("/search", requireStateAccess, async (req, res) => {
  try {
    const {
      q,
      state,
      district,
      subDistrict,
      limit = 20
    } = req.query;

    // Validate search query
    if (!q || q.trim().length < 2) {
      return res.status(400).json({
        success: false,
        error: {
          code: "INVALID_QUERY",
          message: "Search query must contain at least 2 characters"
        }
      });
    }

    // Validate limit
    const parsedLimit = Number(limit);

    if (
      !Number.isInteger(parsedLimit) ||
      parsedLimit < 1 ||
      parsedLimit > 100
    ) {
      return res.status(400).json({
        success: false,
        error: {
          code: "INVALID_LIMIT",
          message: "Limit must be between 1 and 100"
        }
      });
    }

    // Build filters
    const where = {
      village_name: {
        contains: q.trim(),
        mode: "insensitive"
      },

      // IMPORTANT:
      // Only allow states assigned to the logged-in B2B user.
      sub_districts: {
        districts: {
          state_id: {
            in: req.allowedStateIds
          }
        }
      }
    };

    // Optional state filter
    if (state) {
      const stateId = Number(state);

      if (!Number.isInteger(stateId) || stateId <= 0) {
        return res.status(400).json({
          success: false,
          error: {
            code: "INVALID_STATE",
            message: "Invalid state ID"
          }
        });
      }

      // Make sure requested state is assigned to this user
      if (!req.allowedStateIds.includes(stateId)) {
        return res.status(403).json({
          success: false,
          error: {
            code: "STATE_ACCESS_DENIED",
            message: "You do not have access to this state"
          }
        });
      }

      where.sub_districts.districts.state_id = stateId;
    }

    // Optional district filter
    if (district) {
      const districtId = Number(district);

      if (!Number.isInteger(districtId) || districtId <= 0) {
        return res.status(400).json({
          success: false,
          error: {
            code: "INVALID_DISTRICT",
            message: "Invalid district ID"
          }
        });
      }

      where.sub_districts.districts.id = districtId;
    }

    // Optional sub-district filter
    if (subDistrict) {
      const subDistrictId = Number(subDistrict);

      if (!Number.isInteger(subDistrictId) || subDistrictId <= 0) {
        return res.status(400).json({
          success: false,
          error: {
            code: "INVALID_SUBDISTRICT",
            message: "Invalid sub-district ID"
          }
        });
      }

      where.sub_district_id = subDistrictId;
    }

    const villages = await prisma.villages.findMany({
      where,
      take: parsedLimit,
      orderBy: {
        village_name: "asc"
      },
      select: {
        id: true,
        village_code: true,
        village_name: true,
        sub_districts: {
          select: {
            id: true,
            sub_district_code: true,
            sub_district_name: true,
            districts: {
              select: {
                id: true,
                district_code: true,
                district_name: true,
                states: {
                  select: {
                    id: true,
                    state_code: true,
                    state_name: true
                  }
                }
              }
            }
          }
        }
      }
    });

    const data = villages.map((village) => {
      const subDistrictData = village.sub_districts;
      const districtData = subDistrictData.districts;
      const stateData = districtData.states;

      return {
        id: village.id.toString(),
        villageCode: village.village_code,
        villageName: village.village_name,

        fullAddress: [
          village.village_name,
          subDistrictData.sub_district_name,
          districtData.district_name,
          stateData.state_name,
          "India"
        ].join(", "),

        hierarchy: {
          country: "India",

          state: {
            id: stateData.id,
            code: stateData.state_code,
            name: stateData.state_name
          },

          district: {
            id: districtData.id,
            code: districtData.district_code,
            name: districtData.district_name
          },

          subDistrict: {
            id: subDistrictData.id,
            code: subDistrictData.sub_district_code,
            name: subDistrictData.sub_district_name
          },

          village: {
            id: village.id.toString(),
            code: village.village_code,
            name: village.village_name
          }
        }
      };
    });

    res.json({
      success: true,
      count: data.length,
      data
    });
  } catch (error) {
    console.error("Village search failed:", error);

    res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to search villages"
      }
    });
  }
});

module.exports = router;