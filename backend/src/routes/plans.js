const express = require("express");
const { PrismaClient } = require("@prisma/client");
const jwt = require("jsonwebtoken");

const router = express.Router();
const prisma = new PrismaClient();

// ============================================================
// ADMIN AUTH
// ============================================================

function requireAdmin(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication required"
        }
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
          message: "Admin access required"
        }
      });
    }

    req.admin = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: {
        code: "INVALID_TOKEN",
        message: "Invalid or expired authentication token"
      }
    });
  }
}

// ============================================================
// GET ACTIVE PLANS
// GET /v1/plans
// ============================================================

router.get("/", requireAdmin, async (req, res) => {
  try {
    const plans = await prisma.plans.findMany({
      where: {
        is_active: true
      },
      orderBy: {
        id: "asc"
      },
      select: {
        id: true,
        code: true,
        name: true,
        price_monthly: true,
        daily_request_limit: true,
        burst_limit: true,
        state_limit: true,
        is_active: true
      }
    });

    return res.json({
      success: true,
      data: plans
    });
  } catch (error) {
    console.error("Failed to load plans:", error);

    return res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to load plans"
      }
    });
  }
});

module.exports = router;