require("dotenv").config();
const adminUsersRouter = require("./routes/adminUsers");
const express = require("express");
const cors = require("cors");
const usageRouter = require("./routes/usage");
const { PrismaClient } = require("@prisma/client");
const dashboardStatesRouter = require("./routes/dashboardStates");
const statesRouter = require("./routes/states");
const districtsRouter = require("./routes/districts");
const apiKeysRouter = require("./routes/apiKeys");
const subDistrictsRouter = require("./routes/subDistricts");
const villagesRouter = require("./routes/villages");
const searchRouter = require("./routes/search");
const adminAnalyticsRouter = require("./routes/adminAnalytics");
const adminApiKeysRouter = require("./routes/adminApiKeys");
const adminStateAccessRouter = require("./routes/adminStateAccess");
const autocompleteRouter = require("./routes/autocomplete");
const stateAccessRouter = require("./routes/stateAccess");
const apiKeyAuth = require("./middleware/apiKeyAuth");
const requestMeta = require("./middleware/requestMeta");
const rateLimiter = require("./middleware/rateLimiter");
const authRouter = require("./routes/auth");
const apiLogger = require("./middleware/apiLogger");
const app = express();
const prisma = new PrismaClient();

// ===============================
// MIDDLEWARE
// ===============================
app.use(cors());
app.use(express.json());
app.use(requestMeta);
// ===============================
// ROOT ENDPOINT
// ===============================
app.get("/", (req, res) => {
  res.json({
    message: "India Village Geographical Data API",
    status: "running",
    version: "1.0.0"
  });
});

// ===============================
// HEALTH CHECK
// ===============================
app.get("/health", async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;

    res.json({
      success: true,
      status: "healthy",
      database: "connected"
    });
  } catch (error) {
    console.error("Database health check failed:", error);

    res.status(500).json({
      success: false,
      status: "unhealthy",
      database: "disconnected"
    });
  }
});

// ===============================
// API V1 ROUTES
// ===============================
app.use("/v1/auth", authRouter);
app.use("/v1/api-keys", apiKeysRouter);
// API v1 authentication
app.use("/v1/state-access", stateAccessRouter);
app.use("/v1/admin/users", adminUsersRouter);
app.use("/v1/admin", adminStateAccessRouter);
app.use("/v1/admin", adminApiKeysRouter);
app.use("/v1/admin/analytics", adminAnalyticsRouter);
app.use("/v1/dashboard/states", dashboardStatesRouter);
app.use("/v1/usage", usageRouter);
app.use("/v1", apiKeyAuth);
app.use("/v1", rateLimiter);
app.use("/v1", apiLogger);

// States
app.use("/v1/states", statesRouter);

// Districts
app.use("/v1", districtsRouter);

// Sub-Districts
app.use("/v1", subDistrictsRouter);

// Villages
app.use("/v1", villagesRouter);

// Search
app.use("/v1", searchRouter);

// Autocomplete
app.use("/v1", autocompleteRouter);


// ===============================
// 404 HANDLER
// ===============================
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: "NOT_FOUND",
      message: `Route ${req.method} ${req.originalUrl} not found`
    }
  });
});

// ===============================
// GLOBAL ERROR HANDLER
// ===============================
app.use((error, req, res, next) => {
  console.error("Unhandled error:", error);

  res.status(500).json({
    success: false,
    error: {
      code: "INTERNAL_ERROR",
      message: "Internal server error"
    }
  });
});

// ===============================
// START SERVER
// ===============================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});