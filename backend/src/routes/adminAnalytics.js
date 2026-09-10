const express = require("express");
const prisma = require("../lib/prisma");
const adminAuth = require("../middleware/adminAuth");

const router = express.Router();

router.use(adminAuth);

/*
 * GET /v1/admin/analytics/overview
 *
 * Overall API statistics
 */
router.get("/overview", async (req, res) => {
  try {
    const totalRequests = await prisma.api_logs.count();

    const successfulRequests = await prisma.api_logs.count({
      where: {
        status_code: {
          gte: 200,
          lt: 400
        }
      }
    });

    const failedRequests = await prisma.api_logs.count({
      where: {
        status_code: {
          gte: 400
        }
      }
    });

    const activeUsers = await prisma.users.count({
      where: {
        role: "B2B",
        is_active: true
      }
    });

    const activeApiKeys = await prisma.api_keys_new.count({
      where: {
        is_active: true
      }
    });

    const result = await prisma.api_logs.aggregate({
      _avg: {
        response_time: true
      },
      _max: {
        response_time: true
      },
      _min: {
        response_time: true
      }
    });

    res.json({
      success: true,
      data: {
        totalRequests,
        successfulRequests,
        failedRequests,
        successRate:
          totalRequests > 0
            ? Number(((successfulRequests / totalRequests) * 100).toFixed(2))
            : 0,
        activeUsers,
        activeApiKeys,
        averageResponseTimeMs:
          result._avg.response_time !== null
            ? Number(result._avg.response_time.toFixed(2))
            : 0,
        fastestResponseTimeMs:
          result._min.response_time !== null
            ? Number(result._min.response_time.toFixed(2))
            : 0,
        slowestResponseTimeMs:
          result._max.response_time !== null
            ? Number(result._max.response_time.toFixed(2))
            : 0
      }
    });
  } catch (error) {
    console.error("Failed to fetch analytics overview:", error);

    res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to fetch analytics overview"
      }
    });
  }
});


/*
 * GET /v1/admin/analytics/recent
 *
 * Recent API requests
 */
router.get("/recent", async (req, res) => {
  try {
    const limit = Math.min(
      Math.max(Number(req.query.limit) || 20, 1),
      100
    );

    const logs = await prisma.api_logs.findMany({
      orderBy: {
        created_at: "desc"
      },
      take: limit,
      select: {
        id: true,
        endpoint: true,
        method: true,
        status_code: true,
        response_time: true,
        ip_address: true,
        created_at: true,
        user: {
          select: {
            id: true,
            email: true,
            name: true
          }
        },
        api_key: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    const data = logs.map((log) => ({
      id: log.id.toString(),
      endpoint: log.endpoint,
      method: log.method,
      statusCode: log.status_code,
      responseTimeMs:
        log.response_time !== null
          ? Number(log.response_time.toFixed(2))
          : null,
      ipAddress: log.ip_address,
      createdAt: log.created_at,
      user: log.user,
      apiKey: log.api_key
    }));

    res.json({
      success: true,
      count: data.length,
      data
    });
  } catch (error) {
    console.error("Failed to fetch recent API logs:", error);

    res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to fetch recent API logs"
      }
    });
  }
});


/*
 * GET /v1/admin/analytics/endpoints
 *
 * Endpoint usage statistics
 */
router.get("/endpoints", async (req, res) => {
  try {
    const logs = await prisma.api_logs.findMany({
      select: {
        endpoint: true,
        status_code: true,
        response_time: true
      }
    });

    const endpointMap = new Map();

    for (const log of logs) {
      if (!endpointMap.has(log.endpoint)) {
        endpointMap.set(log.endpoint, {
          endpoint: log.endpoint,
          requests: 0,
          successful: 0,
          failed: 0,
          totalResponseTime: 0,
          responseSamples: 0
        });
      }

      const item = endpointMap.get(log.endpoint);

      item.requests++;

      if (log.status_code >= 200 && log.status_code < 400) {
        item.successful++;
      } else {
        item.failed++;
      }

      if (log.response_time !== null) {
        item.totalResponseTime += log.response_time;
        item.responseSamples++;
      }
    }

    const data = Array.from(endpointMap.values())
      .map((item) => ({
        endpoint: item.endpoint,
        requests: item.requests,
        successful: item.successful,
        failed: item.failed,
        successRate:
          item.requests > 0
            ? Number(
                ((item.successful / item.requests) * 100).toFixed(2)
              )
            : 0,
        averageResponseTimeMs:
          item.responseSamples > 0
            ? Number(
                (
                  item.totalResponseTime / item.responseSamples
                ).toFixed(2)
              )
            : 0
      }))
      .sort((a, b) => b.requests - a.requests);

    res.json({
      success: true,
      count: data.length,
      data
    });
  } catch (error) {
    console.error("Failed to fetch endpoint analytics:", error);

    res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to fetch endpoint analytics"
      }
    });
  }
});

module.exports = router;