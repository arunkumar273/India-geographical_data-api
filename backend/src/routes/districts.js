const express = require("express");
const prisma = require("../lib/prisma");
const { requireStateAccess } = require("../middleware/stateAccess");

const router = express.Router();

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
            message: "Invalid state ID"
          }
        });
      }

      // Check whether the user has access to this state
      if (!req.allowedStateIds.includes(stateId)) {
        return res.status(403).json({
          success: false,
          error: {
            code: "STATE_ACCESS_DENIED",
            message: "You do not have access to this state"
          }
        });
      }

      const state = await prisma.states.findUnique({
        where: {
          id: stateId
        }
      });

      if (!state) {
        return res.status(404).json({
          success: false,
          error: {
            code: "STATE_NOT_FOUND",
            message: "State not found"
          }
        });
      }

      const districts = await prisma.districts.findMany({
        where: {
          state_id: stateId
        },
        orderBy: {
          district_name: "asc"
        },
        select: {
          id: true,
          district_code: true,
          district_name: true
        }
      });

      res.json({
        success: true,
        count: districts.length,
        data: districts
      });
    } catch (error) {
      console.error("Failed to fetch districts:", error);

      res.status(500).json({
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to fetch districts"
        }
      });
    }
  }
);

module.exports = router;