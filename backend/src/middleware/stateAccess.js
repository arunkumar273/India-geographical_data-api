const prisma = require("../lib/prisma");

async function getAllowedStateIds(userId) {
  const access = await prisma.user_state_access.findMany({
    where: {
      user_id: userId
    },
    select: {
      state_id: true
    }
  });

  return access.map((item) => item.state_id);
}

async function requireStateAccess(req, res, next) {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: "User authentication required"
        }
      });
    }

    const allowedStateIds = await getAllowedStateIds(req.user.id);

    if (allowedStateIds.length === 0) {
      return res.status(403).json({
        success: false,
        error: {
          code: "NO_STATE_ACCESS",
          message: "No states have been assigned to this account"
        }
      });
    }

    req.allowedStateIds = allowedStateIds;

    next();
  } catch (error) {
    console.error("State access check failed:", error);

    res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to verify state access"
      }
    });
  }
}

module.exports = {
  getAllowedStateIds,
  requireStateAccess
};