const express = require("express");
const bcrypt = require("bcryptjs");

const router = express.Router();
const jwt = require("jsonwebtoken");

const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// Register a new user
router.post("/register", async (req, res) => {
  try {
    const { name, email, password} = req.body;

    // Validate input
    if (!name || !email || !password) {
      return res.status(400).json({
        error: "Name, email, and password are required"
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        error: "Password must be at least 8 characters"
      });
    }

    // Hash the password
    const passwordHash = await bcrypt.hash(password, 10);

    // Save the user in PostgreSQL
    const result = await pool.query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ($1, $2, $3, 'student')
       RETURNING id, name, email, role, created_at`,
      [name, email.toLowerCase().trim(), passwordHash]
    );

    res.status(201).json({
      message: "User registered successfully",
      user: result.rows[0]
    });
  } catch (error) {
    if (error.code === "23505") {
      return res.status(409).json({
        error: "Email already registered"
      });
    }

    console.error(error.message);
    res.status(500).json({
      error: "Registration failed"
    });
  }
});
// Login an existing user
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        error: "Email and password are required"
      });
    }

    // Find user by email
    const result = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email.toLowerCase().trim()]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        error: "Invalid email or password"
      });
    }

    const user = result.rows[0];

    // Verify password
    const passwordMatch = await bcrypt.compare(
      password,
      user.password_hash
    );

    if (!passwordMatch) {
      return res.status(401).json({
        error: "Invalid email or password"
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        id: user.id,
        role: user.role
      },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({
      message: "Login successful",
      token: token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({
      error: "Login failed"
    });
  }
});

module.exports = router;