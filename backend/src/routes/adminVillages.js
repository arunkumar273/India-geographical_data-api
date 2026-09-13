const express = require("express");
const jwt = require("jsonwebtoken");
const prisma = require("../lib/prisma");

const router = express.Router();

/* =========================
   BIGINT SERIALIZATION
   ========================= */

function serializeBigInt(value) {
  return JSON.parse(
    JSON.stringify(value, (_, v) =>
      typeof v === "bigint" ? v.toString() : v
    )
  );
}

/* =========================
   ADMIN AUTHENTICATION
   ========================= */

function requireAdmin(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: "Admin authentication required",
        },
      });
    }

    const token = authHeader.substring(7);

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    if (decoded.role !== "ADMIN") {
      return res.status(403).json({
        success: false,
        error: {
          code: "FORBIDDEN",
          message: "Admin access required",
        },
      });
    }

    req.admin = decoded;

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: {
        code: "INVALID_TOKEN",
        message: "Invalid or expired authentication token",
      },
    });
  }
}

/* =========================
   GET STATES FOR ADMIN
   ========================= */

router.get(
  "/states",
  requireAdmin,
  async (req, res) => {
    try {
      const states =
        await prisma.states.findMany({
          orderBy: {
            state_name: "asc",
          },
          select: {
            id: true,
            state_name: true,
          },
        });

      return res.json(
        serializeBigInt({
          success: true,
          data: states,
        })
      );
    } catch (error) {
      console.error(
        "Admin states error:",
        error
      );

      return res.status(500).json({
        success: false,
        error: {
          code: "ADMIN_STATES_ERROR",
          message:
            "Failed to load states",
        },
      });
    }
  }
);

/* =========================
   GET DISTRICTS FOR ADMIN
   ========================= */

router.get(
  "/districts",
  requireAdmin,
  async (req, res) => {
    try {
      const stateId = Number(
        req.query.stateId
      );

      if (Number.isNaN(stateId)) {
        return res.status(400).json({
          success: false,
          error: {
            code: "INVALID_STATE_ID",
            message:
              "Valid stateId is required",
          },
        });
      }

      const districts =
        await prisma.districts.findMany({
          where: {
            state_id: stateId,
          },
          orderBy: {
            district_name: "asc",
          },
          select: {
            id: true,
            district_name: true,
            state_id: true,
          },
        });

      return res.json(
        serializeBigInt({
          success: true,
          data: districts,
        })
      );
    } catch (error) {
      console.error(
        "Admin districts error:",
        error
      );

      return res.status(500).json({
        success: false,
        error: {
          code: "ADMIN_DISTRICTS_ERROR",
          message:
            "Failed to load districts",
        },
      });
    }
  }
);

/* =========================
   GET SUB-DISTRICTS FOR ADMIN
   ========================= */

router.get(
  "/subdistricts",
  requireAdmin,
  async (req, res) => {
    try {
      const districtId = Number(
        req.query.districtId
      );

      if (Number.isNaN(districtId)) {
        return res.status(400).json({
          success: false,
          error: {
            code: "INVALID_DISTRICT_ID",
            message:
              "Valid districtId is required",
          },
        });
      }

      const subDistricts =
        await prisma.sub_districts.findMany({
          where: {
            district_id: districtId,
          },
          orderBy: {
            sub_district_name: "asc",
          },
          select: {
            id: true,
            sub_district_name: true,
            district_id: true,
          },
        });

      return res.json(
        serializeBigInt({
          success: true,
          data: subDistricts,
        })
      );
    } catch (error) {
      console.error(
        "Admin sub-districts error:",
        error
      );

      return res.status(500).json({
        success: false,
        error: {
          code: "ADMIN_SUBDISTRICTS_ERROR",
          message:
            "Failed to load sub-districts",
        },
      });
    }
  }
);
/* =========================
   GET VILLAGES
   ========================= */

router.get("/", requireAdmin, async (req, res) => {
  try {
    /* =========================
       READ QUERY PARAMETERS
       ========================= */

    const stateId = req.query.stateId
      ? Number(req.query.stateId)
      : null;

    const districtId = req.query.districtId
      ? Number(req.query.districtId)
      : null;

    const subDistrictId = req.query.subDistrictId
      ? Number(req.query.subDistrictId)
      : null;

    const search = String(
      req.query.search || ""
    ).trim();

    const page = Math.max(
      1,
      Number(req.query.page || 1)
    );

    const limit = Math.min(
      100,
      Math.max(
        1,
        Number(req.query.limit || 50)
      )
    );

    const skip = (page - 1) * limit;

    /* =========================
       VALIDATE FILTER IDS
       ========================= */

    if (
      stateId !== null &&
      Number.isNaN(stateId)
    ) {
      return res.status(400).json({
        success: false,
        error: {
          code: "INVALID_STATE_ID",
          message: "Invalid stateId",
        },
      });
    }

    if (
      districtId !== null &&
      Number.isNaN(districtId)
    ) {
      return res.status(400).json({
        success: false,
        error: {
          code: "INVALID_DISTRICT_ID",
          message: "Invalid districtId",
        },
      });
    }

    if (
      subDistrictId !== null &&
      Number.isNaN(subDistrictId)
    ) {
      return res.status(400).json({
        success: false,
        error: {
          code: "INVALID_SUBDISTRICT_ID",
          message: "Invalid subDistrictId",
        },
      });
    }

    /* =========================
       BUILD VILLAGE FILTER
       ========================= */

    const villageWhere = {};

    /*
      Direct sub-district filter
    */
    if (subDistrictId !== null) {
      villageWhere.sub_district_id =
        subDistrictId;
    }

    /*
      Village search
    */
    if (search) {
      villageWhere.village_name = {
        contains: search,
        mode: "insensitive",
      };
    }

    /* =========================
       APPLY STATE / DISTRICT
       ========================= */

    if (
      stateId !== null ||
      districtId !== null
    ) {
      let subDistrictWhere = {};

      /*
        District filter
      */
      if (districtId !== null) {
        subDistrictWhere.district_id =
          districtId;
      }

      /*
        Get matching sub-districts
      */
      const subDistricts =
        await prisma.sub_districts.findMany({
          where: subDistrictWhere,

          select: {
            id: true,
            district_id: true,
          },
        });

      let filteredSubDistricts =
        subDistricts;

      /*
        Filter sub-districts by state
      */
      if (stateId !== null) {
        const districts =
          await prisma.districts.findMany({
            where: {
              state_id: stateId,
            },

            select: {
              id: true,
            },
          });

        const districtIds =
          new Set(
            districts.map(
              (district) => district.id
            )
          );

        filteredSubDistricts =
          filteredSubDistricts.filter(
            (subDistrict) =>
              districtIds.has(
                subDistrict.district_id
              )
          );
      }

      /*
        Get allowed sub-district IDs
      */
      const allowedSubDistrictIds =
        filteredSubDistricts.map(
          (subDistrict) =>
            subDistrict.id
        );

      /*
        No matching sub-districts
      */
      if (
        allowedSubDistrictIds.length === 0
      ) {
        return res.json({
          success: true,

          data: [],

          pagination: {
            page,
            limit,
            total: 0,
            totalPages: 0,
          },
        });
      }

      /*
        Apply sub-district IDs
        to village query
      */
      villageWhere.sub_district_id = {
        in: allowedSubDistrictIds,
      };
    }

    /* =========================
       QUERY VILLAGES
       ========================= */

    const [
      villages,
      total,
    ] = await Promise.all([
      prisma.villages.findMany({
        where: villageWhere,

        orderBy: {
          village_name: "asc",
        },

        skip,

        take: limit,

        select: {
          id: true,
          village_code: true,
          village_name: true,
          sub_district_id: true,
        },
      }),

      prisma.villages.count({
        where: villageWhere,
      }),
    ]);

    /* =========================
       BUILD HIERARCHY
       ========================= */

    const subDistrictIds = [
      ...new Set(
        villages.map(
          (village) =>
            village.sub_district_id
        )
      ),
    ];

    const subDistrictMap =
      new Map();

    const districtMap =
      new Map();

    const stateMap =
      new Map();

    /* =========================
       LOAD SUB-DISTRICTS
       ========================= */

    if (
      subDistrictIds.length > 0
    ) {
      const subDistricts =
        await prisma.sub_districts.findMany({
          where: {
            id: {
              in: subDistrictIds,
            },
          },

          select: {
            id: true,
            sub_district_name: true,
            district_id: true,
          },
        });

      subDistricts.forEach(
        (subDistrict) => {
          subDistrictMap.set(
            subDistrict.id,
            subDistrict
          );
        }
      );

      /* =========================
         LOAD DISTRICTS
         ========================= */

      const districtIds = [
        ...new Set(
          subDistricts.map(
            (subDistrict) =>
              subDistrict.district_id
          )
        ),
      ];

      if (
        districtIds.length > 0
      ) {
        const districts =
          await prisma.districts.findMany({
            where: {
              id: {
                in: districtIds,
              },
            },

            select: {
              id: true,
              district_name: true,
              state_id: true,
            },
          });

        districts.forEach(
          (district) => {
            districtMap.set(
              district.id,
              district
            );
          }
        );

        /* =========================
           LOAD STATES
           ========================= */

        const stateIds = [
          ...new Set(
            districts.map(
              (district) =>
                district.state_id
            )
          ),
        ];

        if (
          stateIds.length > 0
        ) {
          const states =
            await prisma.states.findMany({
              where: {
                id: {
                  in: stateIds,
                },
              },

              select: {
                id: true,
                state_name: true,
              },
            });

          states.forEach(
            (state) => {
              stateMap.set(
                state.id,
                state
              );
            }
          );
        }
      }
    }

    /* =========================
       FORMAT VILLAGE RESPONSE
       ========================= */

    const formattedVillages =
      villages.map(
        (village) => {
          const subDistrict =
            subDistrictMap.get(
              village.sub_district_id
            );

          const district =
            subDistrict
              ? districtMap.get(
                  subDistrict.district_id
                )
              : null;

          const state =
            district
              ? stateMap.get(
                  district.state_id
                )
              : null;

          const villageName =
            village.village_name ||
            "-";

          const subDistrictName =
            subDistrict?.sub_district_name ||
            "-";

          const districtName =
            district?.district_name ||
            "-";

          const stateName =
            state?.state_name ||
            "-";

          return {
            id: village.id,

            villageCode:
              village.village_code ||
              "-",

            villageName,

            subDistrictName,

            districtName,

            stateName,

            fullAddress:
              `${villageName}, ${subDistrictName}, ${districtName}, ${stateName}, India`,
          };
        }
      );

    /* =========================
       PAGINATION
       ========================= */

    const totalPages =
      total === 0
        ? 0
        : Math.ceil(
            total / limit
          );

    /* =========================
       FINAL RESPONSE
       ========================= */

    return res.json(
      serializeBigInt({
        success: true,

        data: formattedVillages,

        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
      })
    );
  } catch (error) {
    console.error(
      "Admin Village Master error:",
      error
    );

    return res.status(500).json({
      success: false,

      error: {
        code: "VILLAGE_MASTER_ERROR",

        message:
          "Failed to load village master data",
      },
    });
  }
});

/* =========================
   EXPORT ROUTER
   ========================= */

module.exports = router;