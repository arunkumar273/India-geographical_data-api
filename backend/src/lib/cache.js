const redis = require("./redis");

const DEFAULT_TTL = 300; // 5 minutes

async function getCache(key) {
  try {
    return await redis.get(key);
  } catch (error) {
    console.error("Redis cache GET failed:", error);
    return null;
  }
}

async function setCache(key, value, ttl = DEFAULT_TTL) {
  try {
    await redis.set(key, value, {
      ex: ttl,
    });

    return true;
  } catch (error) {
    console.error("Redis cache SET failed:", error);
    return false;
  }
}

async function deleteCache(key) {
  try {
    await redis.del(key);
    return true;
  } catch (error) {
    console.error("Redis cache DELETE failed:", error);
    return false;
  }
}

module.exports = {
  getCache,
  setCache,
  deleteCache,
};