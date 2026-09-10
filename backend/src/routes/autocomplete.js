const express = require("express");
const prisma = require("../lib/prisma");

const router = express.Router();

// GET /v1/autocomplete?q=...
router.get("/autocomplete", async (req, res) => {
  try {
    const { q, hierarchyLevel = "village", limit = 10 } = req.query;

    if (!q || q.trim().length < 2) {
      return res.status(400).json({
        success: false,
        error: {
          code: "INVALID_QUERY",
          message: "Query must contain at least 2 characters"
        }
      });
    }

    const parsedLimit = Number(limit);

    if (
      !Number.isInteger(parsedLimit) ||
      parsedLimit < 1 ||
      parsedLimit > 50
    ) {
      return res.status(400).json({
        success: false,
        error: {
          code: "INVALID_QUERY",
          message: "Limit must be between 1 and 50"
        }
      });
    }

    if (hierarchyLevel !== "village") {
      return res.status(400).json({
        success: false,
        error: {
          code: "INVALID_QUERY",
          message: "Currently only village autocomplete is supported"
        }
      });
    }

    const searchTerm = q.trim();

    const villages = await prisma.villages.findMany({
      where: {
        village_name: {
          startsWith: searchTerm,
          mode: "insensitive"
        }
      },
      orderBy: {
        village_name: "asc"
      },
      take: parsedLimit,

      select: {
        id: true,
        village_name: true,

        sub_districts: {
          select: {
            sub_district_name: true,

            districts: {
              select: {
                district_name: true,

                states: {
                  select: {
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
      const subDistrict = village.sub_districts;
      const district = subDistrict.districts;
      const state = district.states;

      return {
        value: `village_id_${village.id.toString()}`,
        label: village.village_name,

        fullAddress: `${village.village_name}, ${subDistrict.sub_district_name}, ${district.district_name}, ${state.state_name}, India`,

        hierarchy: {
          village: village.village_name,
          subDistrict: subDistrict.sub_district_name,
          district: district.district_name,
          state: state.state_name,
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
    console.error("Autocomplete failed:", error);

    res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to perform autocomplete"
      }
    });
  }
});

module.exports = router;