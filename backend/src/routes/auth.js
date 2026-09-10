const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const prisma = require("../lib/prisma");

const router = express.Router();

function generateToken(user) {
  return jwt.sign(
    {
      userId: user.id,
      role: user.role
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || "24h"
    }
  );
}

// B2B Registration
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Name, email and password are required"
        }
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Password must contain at least 8 characters"
        }
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await prisma.users.findUnique({
      where: {
        email: normalizedEmail
      }
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: {
          code: "EMAIL_EXISTS",
          message: "An account with this email already exists"
        }
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.users.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        password_hash: passwordHash,
        role: "B2B"
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        is_active: true,
        created_at: true
      }
    });

    const token = generateToken(user);

    res.status(201).json({
      success: true,
      message: "Registration successful",
      data: {
        user,
        token
      }
    });
  } catch (error) {
    console.error("Registration failed:", error);

    res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Registration failed"
      }
    });
  }
});

// Login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Email and password are required"
        }
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = await prisma.users.findUnique({
      where: {
        email: normalizedEmail
      }
    });

    if (!user || !user.is_active) {
      return res.status(401).json({
        success: false,
        error: {
          code: "INVALID_CREDENTIALS",
          message: "Invalid email or password"
        }
      });
    }

    const passwordMatches = await bcrypt.compare(
      password,
      user.password_hash
    );

    if (!passwordMatches) {
      return res.status(401).json({
        success: false,
        error: {
          code: "INVALID_CREDENTIALS",
          message: "Invalid email or password"
        }
      });
    }

    const token = generateToken(user);

    res.json({
      success: true,
      message: "Login successful",
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          is_active: user.is_active
        },
        token
      }
    });
  } catch (error) {
    console.error("Login failed:", error);

    res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Login failed"
      }
    });
  }
});

module.exports = router;