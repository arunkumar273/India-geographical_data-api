const express = require("express");
const prisma = require("../lib/prisma");

const router = express.Router();

// GET /v1/search
router.get("/search", async (req, res) => {
  try {
    const { q, state, district, subDistrict, limit = 25 } = req.query;

    if (!q || q.trim().length < 2) {
      return res.status(400).json({
        success: false,
        error: {
          code: "INVALID_QUERY",
          message: "Search query must contain at least 2 characters"
        }
      });
    }

    const parsedLimit = Number(limit);

    if (
      !Number.isInteger(parsedLimit) ||
      parsedLimit < 1 ||
      parsedLimit > 100
    ) {
      return res.status(400).json({
        success: false,
        error: {
          code: "INVALID_QUERY",
          message: "Limit must be between 1 and 100"
        }
      });
    }

    const searchTerm = q.trim();

    const villages = await prisma.villages.findMany({
      where: {
        village_name: {
          contains: searchTerm,
          mode: "insensitive"
        },

        ...(state
          ? {
              sub_districts: {
                districts: {
                  states: {
                    state_name: {
                      contains: state,
                      mode: "insensitive"
                    }
                  }
                }
              }
            }
          : {}),

        ...(district
          ? {
              sub_districts: {
                districts: {
                  district_name: {
                    contains: district,
                    mode: "insensitive"
                  }
                }
              }
            }
          : {}),

        ...(subDistrict
          ? {
              sub_districts: {
                sub_district_name: {
                  contains: subDistrict,
                  mode: "insensitive"
                }
              }
            }
          : {})
      },
      orderBy: {
        village_name: "asc"
      },
      take: parsedLimit,

      select: {
        id: true,
        village_code: true,
        village_name: true,

        sub_districts: {
          select: {
            id: true,
            sub_district_name: true,

            districts: {
              select: {
                id: true,
                district_name: true,

                states: {
                  select: {
                    id: true,
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

        fullAddress: `${village.village_name}, ${subDistrictData.sub_district_name}, ${districtData.district_name}, ${stateData.state_name}, India`,

        hierarchy: {
          village: village.village_name,
          subDistrict: subDistrictData.sub_district_name,
          district: districtData.district_name,
          state: stateData.state_name,
          country: "India"
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