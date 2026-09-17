const express = require("express");
const prisma = require("../lib/prisma");
const { requireStateAccess } = require("../middleware/stateAccess");

const router = express.Router();
/**
 * @swagger
 * /v1/autocomplete:
 *   get:
 *     summary: Village autocomplete
 *     description: Provides autocomplete suggestions for Indian village and area names.
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
 *         description: Text used for autocomplete
 *       - in: query
 *         name: limit
 *         required: false
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Maximum number of suggestions
 *     responses:
 *       200:
 *         description: Autocomplete suggestions retrieved successfully
 *       400:
 *         description: Invalid autocomplete request
 *       401:
 *         description: Invalid or missing API credentials
 *       429:
 *         description: Rate limit exceeded
 *       500:
 *         description: Internal server error
 */
router.get(
  "/autocomplete",
  requireStateAccess,
  async (req, res) => {
    try {
      const {
        q,
        hierarchyLevel = "village",
        limit = 10
      } = req.query;

      // Validate query
      if (!q || q.trim().length < 2) {
        return res.status(400).json({
          success: false,
          error: {
            code: "INVALID_QUERY",
            message: "Autocomplete query must contain at least 2 characters"
          }
        });
      }

      // Currently supported hierarchy level
      if (hierarchyLevel !== "village") {
        return res.status(400).json({
          success: false,
          error: {
            code: "INVALID_HIERARCHY_LEVEL",
            message: "Only village hierarchy level is currently supported"
          }
        });
      }

      // Validate limit
      const parsedLimit = Number(limit);

      if (
        !Number.isInteger(parsedLimit) ||
        parsedLimit < 1 ||
        parsedLimit > 50
      ) {
        return res.status(400).json({
          success: false,
          error: {
            code: "INVALID_LIMIT",
            message: "Limit must be between 1 and 50"
          }
        });
      }

      const villages = await prisma.villages.findMany({
        where: {
          village_name: {
            startsWith: q.trim(),
            mode: "insensitive"
          },

          // IMPORTANT:
          // Only return villages belonging to states
          // assigned to the logged-in B2B user.
          sub_districts: {
            districts: {
              state_id: {
                in: req.allowedStateIds
              }
            }
          }
        },

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
          value: village.village_name,

          label: village.village_name,

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
      console.error("Village autocomplete failed:", error);

      res.status(500).json({
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to generate autocomplete results"
        }
      });
    }
  }
);

module.exports = router;