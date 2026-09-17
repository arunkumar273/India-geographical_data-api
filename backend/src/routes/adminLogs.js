const express = require("express");
const jwt = require("jsonwebtoken");
const prisma = require("../lib/prisma");

const router = express.Router();
/**
 * @swagger
 * /v1/admin/logs:
 *   get:
 *     summary: View API logs
 *     description: Returns paginated API request logs with optional status, endpoint, method, and client filters.
 *     tags:
 *       - Admin
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *           maximum: 100
 *       - in: query
 *         name: status
 *         schema:
 *           type: integer
 *         description: HTTP status code
 *       - in: query
 *         name: endpoint
 *         schema:
 *           type: string
 *       - in: query
 *         name: userId
 *         schema:
 *           type: integer
 *       - in: query
 *         name: method
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: API logs retrieved successfully
 *       401:
 *         description: Admin authentication required
 *       403:
 *         description: Admin access required
 *       500:
 *         description: Internal server error
 */
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
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

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
        message: "Invalid or expired admin token",
      },
    });
  }
}

function serializeBigInt(value) {
  return JSON.parse(
    JSON.stringify(value, (_, v) =>
      typeof v === "bigint" ? v.toString() : v
    )
  );
}

/**
 * GET /v1/admin/logs/filters
 *
 * Returns dynamic filter options for the Admin API Logs page.
 */
router.get("/filters", requireAdmin, async (req, res) => {
  try {
    const [endpoints, users] = await Promise.all([
      prisma.api_logs.findMany({
        distinct: ["endpoint"],
        select: {
          endpoint: true,
        },
        orderBy: {
          endpoint: "asc",
        },
      }),

      prisma.users.findMany({
        where: {
          api_logs: {
            some: {},
          },
        },
        select: {
          id: true,
          email: true,
          business_name: true,
        },
        orderBy: {
          email: "asc",
        },
      }),
    ]);

    return res.json({
      success: true,
      data: {
        endpoints: endpoints.map((item) => item.endpoint),

        users: users.map((user) => ({
          id: user.id,
          email: user.email,
          businessName: user.business_name,
        })),
      },
    });
  } catch (error) {
    console.error("Admin API Log filters error:", error);

    return res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to load API log filters",
      },
    });
  }
});

/**
 * GET /v1/admin/logs
 */
router.get("/", requireAdmin, async (req, res) => {
  try {
    let {
      page = 1,
      limit = 50,
      status,
      endpoint,
      userId,
      method,
    } = req.query;

    page = Math.max(1, Number(page) || 1);
    limit = Math.min(100, Math.max(1, Number(limit) || 50));

    const skip = (page - 1) * limit;

    const where = {};

    // Status
    if (status !== undefined && status !== "") {
      const statusCode = Number(status);

      if (!Number.isInteger(statusCode)) {
        return res.status(400).json({
          success: false,
          error: {
            code: "INVALID_STATUS",
            message: "Status must be a valid HTTP status code",
          },
        });
      }

      where.status_code = statusCode;
    }

    // Endpoint
    if (endpoint && endpoint.trim() !== "") {
      where.endpoint = endpoint.trim();
    }

    // HTTP method
    if (method && method.trim() !== "") {
      where.method = method.trim().toUpperCase();
    }

    // User
    if (userId !== undefined && userId !== "") {
      const parsedUserId = Number(userId);

      if (!Number.isInteger(parsedUserId)) {
        return res.status(400).json({
          success: false,
          error: {
            code: "INVALID_USER_ID",
            message: "userId must be a valid integer",
          },
        });
      }

      where.user_id = parsedUserId;
    }

    const [logs, total] = await Promise.all([
      prisma.api_logs.findMany({
        where,
        orderBy: {
          created_at: "desc",
        },
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              business_name: true,
            },
          },
          api_key: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),

      prisma.api_logs.count({
        where,
      }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return res.json(
      serializeBigInt({
        success: true,
        data: {
          logs: logs.map((log) => ({
            id: log.id,
            timestamp: log.created_at,

            client: {
              userId: log.user?.id ?? null,
              email: log.user?.email ?? null,
              businessName: log.user?.business_name ?? null,
            },

            apiKey: {
              id: log.api_key?.id ?? null,
              name: log.api_key?.name ?? null,
            },

            endpoint: log.endpoint,
            method: log.method,
            statusCode: log.status_code,
            responseTimeMs: log.response_time,
            ipAddress: log.ip_address,
          })),

          pagination: {
            page,
            limit,
            total,
            totalPages,
          },
        },
      })
    );
  } catch (error) {
    console.error("Admin API Logs error:", error);

    return res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to load API logs",
      },
    });
  }
});

module.exports = router;