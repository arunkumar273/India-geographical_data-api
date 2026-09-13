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

// Common free/personal email providers
const FREE_EMAIL_PROVIDERS = new Set([
  "gmail.com",
  "yahoo.com",
  "yahoo.co.in",
  "hotmail.com",
  "outlook.com",
  "outlook.in",
  "live.com",
  "icloud.com",
  "protonmail.com",
  "proton.me",
  "aol.com",
  "mail.com",
  "zoho.com",
  "yandex.com",
  "gmx.com"
]);

function isValidBusinessEmail(email) {
  const parts = email.split("@");

  if (parts.length !== 2) {
    return false;
  }

  const domain = parts[1].toLowerCase();

  return !FREE_EMAIL_PROVIDERS.has(domain);
}

function isStrongPassword(password) {
  // At least:
  // 8 characters
  // one uppercase
  // one lowercase
  // one number
  // one special character
  return (
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /[0-9]/.test(password) &&
    /[^A-Za-z0-9]/.test(password)
  );
}

function isValidPhone(phone) {
  // Allows country code and common phone formatting.
  // Example: +91 9876543210
  const cleaned = phone.replace(/[\s\-()]/g, "");

  return /^\+[1-9]\d{7,14}$/.test(cleaned);
}

// ============================================================
// B2B REGISTRATION
// ============================================================

router.post("/register", async (req, res) => {
  try {
    const {
      name,
      business_name,
      email,
      gst_number,
      phone_number,
      password,
      confirm_password
    } = req.body;

    // --------------------------------------------------------
    // Required fields
    // --------------------------------------------------------

    if (
      !name ||
      !business_name ||
      !email ||
      !phone_number ||
      !password ||
      !confirm_password
    ) {
      return res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message:
            "Name, business name, business email, phone number, password and confirm password are required"
        }
      });
    }

    // --------------------------------------------------------
    // Normalize values
    // --------------------------------------------------------

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedName = name.trim();
    const normalizedBusinessName = business_name.trim();
    const normalizedPhone = phone_number.trim();

    // --------------------------------------------------------
    // Name validation
    // --------------------------------------------------------

    if (normalizedName.length < 2) {
      return res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Name must contain at least 2 characters"
        }
      });
    }

    if (normalizedBusinessName.length < 2) {
      return res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Business name must contain at least 2 characters"
        }
      });
    }

    // --------------------------------------------------------
    // Email validation
    // --------------------------------------------------------

    const emailRegex =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        error: {
          code: "INVALID_EMAIL",
          message: "Please provide a valid business email address"
        }
      });
    }

    if (!isValidBusinessEmail(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        error: {
          code: "BUSINESS_EMAIL_REQUIRED",
          message:
            "Please use a business email address. Personal email providers are not allowed."
        }
      });
    }

    // --------------------------------------------------------
    // Phone validation
    // --------------------------------------------------------

    if (!isValidPhone(normalizedPhone)) {
      return res.status(400).json({
        success: false,
        error: {
          code: "INVALID_PHONE",
          message:
            "Phone number must include a valid country code, for example +919876543210"
        }
      });
    }

    // --------------------------------------------------------
    // Password validation
    // --------------------------------------------------------

    if (!isStrongPassword(password)) {
      return res.status(400).json({
        success: false,
        error: {
          code: "WEAK_PASSWORD",
          message:
            "Password must contain at least 8 characters, including uppercase, lowercase, number and special character"
        }
      });
    }

    // --------------------------------------------------------
    // Confirm password
    // --------------------------------------------------------

    if (password !== confirm_password) {
      return res.status(400).json({
        success: false,
        error: {
          code: "PASSWORD_MISMATCH",
          message: "Password and confirm password do not match"
        }
      });
    }

    // --------------------------------------------------------
    // GST validation - optional
    // --------------------------------------------------------

    let normalizedGst = null;

    if (gst_number && gst_number.trim()) {
      normalizedGst = gst_number.trim().toUpperCase();

      // Standard Indian GSTIN format
      const gstRegex =
        /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;

      if (!gstRegex.test(normalizedGst)) {
        return res.status(400).json({
          success: false,
          error: {
            code: "INVALID_GST",
            message: "Please provide a valid GST number"
          }
        });
      }
    }

    // --------------------------------------------------------
    // Existing account check
    // --------------------------------------------------------

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

    // --------------------------------------------------------
    // Hash password
    // --------------------------------------------------------

    const passwordHash = await bcrypt.hash(password, 12);

    // --------------------------------------------------------
    // Create PENDING B2B account
    // --------------------------------------------------------

    const user = await prisma.users.create({
      data: {
        name: normalizedName,
        email: normalizedEmail,
        password_hash: passwordHash,
        business_name: normalizedBusinessName,
        gst_number: normalizedGst,
        phone_number: normalizedPhone,
        role: "B2B",
        approval_status: "PENDING_APPROVAL",
        is_active: true,
        plan_id: 1
      },
      select: {
        id: true,
        name: true,
        email: true,
        business_name: true,
        gst_number: true,
        phone_number: true,
        role: true,
        approval_status: true,
        is_active: true,
        plan_id: true,
        created_at: true
      }
    });

    // --------------------------------------------------------
    // IMPORTANT:
    // Do NOT issue an API key.
    // Do NOT issue an authentication token as an approved user.
    // --------------------------------------------------------

    return res.status(201).json({
      success: true,
      message:
        "Registration submitted successfully. Your account is pending admin approval.",
      data: {
        user
      }
    });
  } catch (error) {
    console.error("Registration failed:", error);

    return res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Registration failed"
      }
    });
  }
});

// ============================================================
// LOGIN
// ============================================================

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

    // --------------------------------------------------------
    // Rejected account
    // --------------------------------------------------------

    if (user.approval_status === "REJECTED") {
      return res.status(403).json({
        success: false,
        error: {
          code: "ACCOUNT_REJECTED",
          message:
            user.rejection_reason ||
            "Your account registration has been rejected."
        }
      });
    }

    // --------------------------------------------------------
    // Pending account
    // --------------------------------------------------------

    if (user.approval_status === "PENDING_APPROVAL") {
      return res.status(403).json({
        success: false,
        error: {
          code: "PENDING_APPROVAL",
          message:
            "Your account is pending admin approval. You will be able to access the platform after approval."
        }
      });
    }

    // --------------------------------------------------------
    // Approved account
    // --------------------------------------------------------

    const token = generateToken(user);

    return res.json({
      success: true,
      message: "Login successful",
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          business_name: user.business_name,
          gst_number: user.gst_number,
          phone_number: user.phone_number,
          role: user.role,
          approval_status: user.approval_status,
          is_active: user.is_active,
          plan_id: user.plan_id
        },
        token
      }
    });
  } catch (error) {
    console.error("Login failed:", error);

    return res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Login failed"
      }
    });
  }
});

module.exports = router;