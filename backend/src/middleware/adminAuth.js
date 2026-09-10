const jwt = require("jsonwebtoken");
const prisma = require("../lib/prisma");

async function adminAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: "Bearer token is required"
        }
      });
    }

    const token = authHeader.substring(7);

    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET is not configured");

      return res.status(500).json({
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Authentication service is not configured"
        }
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await prisma.users.findUnique({
      where: {
        id: decoded.userId
      }
    });

    if (!user || !user.is_active) {
      return res.status(401).json({
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: "User account is invalid or inactive"
        }
      });
    }

    if (user.role !== "ADMIN") {
      return res.status(403).json({
        success: false,
        error: {
          code: "ADMIN_ACCESS_REQUIRED",
          message: "Administrator access is required"
        }
      });
    }

    req.user = user;

    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        error: {
          code: "TOKEN_EXPIRED",
          message: "Authentication token has expired"
        }
      });
    }

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        error: {
          code: "INVALID_TOKEN",
          message: "Invalid authentication token"
        }
      });
    }

    console.error("Admin authentication failed:", error);

    return res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Authentication failed"
      }
    });
  }
}

module.exports = adminAuth;