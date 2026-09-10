const express = require("express");
const prisma = require("../lib/prisma");
const jwtAuth = require("../middleware/jwtAuth");

const router = express.Router();

router.use(jwtAuth);

router.get("/", async (req, res) => {
  try {
    const userId = req.user.id;

    const now = new Date();

    // Start of today
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);

    // Start of current month
    const startOfMonth = new Date(
      now.getFullYear(),
      now.getMonth(),
      1
    );

    // Last 24 hours
    const last24Hours = new Date(
      now.getTime() - 24 * 60 * 60 * 1000
    );

    // Last 30 days
    const last30Days = new Date(
      now.getTime() - 30 * 24 * 60 * 60 * 1000
    );

    /* =========================================
       REQUEST COUNTS
    ========================================= */

    const todayRequests = await prisma.api_logs.count({
      where: {
        user_id: userId,
        created_at: {
          gte: startOfToday,
        },
      },
    });

    const monthRequests = await prisma.api_logs.count({
      where: {
        user_id: userId,
        created_at: {
          gte: startOfMonth,
        },
      },
    });

    /* =========================================
       LAST 24 HOURS
    ========================================= */

    const last24Logs = await prisma.api_logs.findMany({
      where: {
        user_id: userId,
        created_at: {
          gte: last24Hours,
        },
      },
      select: {
        status_code: true,
        response_time: true,
      },
    });

    const successful24 = last24Logs.filter(
      (log) =>
        log.status_code >= 200 &&
        log.status_code < 400
    ).length;

    const failed24 = last24Logs.filter(
      (log) => log.status_code >= 400
    ).length;

    const averageResponseTime =
      last24Logs.length > 0
        ? last24Logs.reduce(
            (sum, log) =>
              sum + Number(log.response_time || 0),
            0
          ) / last24Logs.length
        : 0;

    const successPercentage =
      last24Logs.length > 0
        ? (successful24 / last24Logs.length) * 100
        : 0;

    /* =========================================
       LAST 30 DAYS
    ========================================= */

    const last30Logs = await prisma.api_logs.findMany({
      where: {
        user_id: userId,
        created_at: {
          gte: last30Days,
        },
      },
      select: {
        created_at: true,
        status_code: true,
      },
      orderBy: {
        created_at: "asc",
      },
    });

    const dailyUsage = {};

    for (const log of last30Logs) {
      const date = log.created_at
        .toISOString()
        .slice(0, 10);

      if (!dailyUsage[date]) {
        dailyUsage[date] = {
          date,
          requests: 0,
          successful: 0,
          failed: 0,
        };
      }

      dailyUsage[date].requests += 1;

      if (
        log.status_code >= 200 &&
        log.status_code < 400
      ) {
        dailyUsage[date].successful += 1;
      } else {
        dailyUsage[date].failed += 1;
      }
    }

    /* =========================================
       RECENT REQUESTS
    ========================================= */

    const recentLogs = await prisma.api_logs.findMany({
      where: {
        user_id: userId,
      },
      select: {
        id: true,
        endpoint: true,
        method: true,
        status_code: true,
        response_time: true,
        created_at: true,
      },
      orderBy: {
        created_at: "desc",
      },
      take: 20,
    });

    /*
     * Prisma returns BigInt for api_logs.id.
     * BigInt cannot be directly serialized by JSON.
     * Convert it to a string before sending the response.
     */

    const recentRequests = recentLogs.map((log) => ({
      ...log,
      id: log.id.toString(),
    }));

    /* =========================================
       RESPONSE
    ========================================= */

    res.json({
      success: true,

      data: {
        summary: {
          todayRequests,
          monthRequests,

          successfulRequests: successful24,

          failedRequests: failed24,

          successPercentage: Number(
            successPercentage.toFixed(2)
          ),

          averageResponseTime: Number(
            averageResponseTime.toFixed(2)
          ),
        },

        dailyUsage: Object.values(dailyUsage),

        recentRequests,
      },
    });
  } catch (error) {
    console.error(
      "Failed to load API usage:",
      error
    );

    res.status(500).json({
      success: false,

      error: {
        code: "INTERNAL_ERROR",

        message:
          "Failed to load API usage",
      },
    });
  }
});

module.exports = router;