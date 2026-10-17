
const express = require("express");
const jwt = require("jsonwebtoken");
const { Pool } = require("pg");

const router = express.Router();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// Verify the user's JWT token
function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      error: "Authentication token required"
    });
  }

  const token = authHeader.split(" ")[1];

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (error) {
    return res.status(401).json({
      error: "Invalid or expired token"
    });
  }
}

// Get an attempt by ID
router.get("/:id", authenticateToken, async (req, res) => {
  try {
    const attemptId = Number(req.params.id);

    if (!Number.isInteger(attemptId) || attemptId <= 0) {
      return res.status(400).json({
        error: "Invalid attempt ID"
      });
    }

    const result = await pool.query(
      `SELECT
         a.id,
         a.user_id,
         a.assignment_id,
         a.started_at,
         a.deadline,
         a.submitted_at,
         a.answer,
         a.answer_link,
         a.status,
         a.score,
         a.checks
       FROM attempts a
       WHERE a.id = $1
         AND (a.user_id = $2 OR $3 = 'admin')`,
      [attemptId, req.user.id, req.user.role]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "Attempt not found"
      });
    }

    return res.json({
      message: "Attempt retrieved successfully",
      attempt: result.rows[0]
    });
  } catch (error) {
    console.error(error.message);

    return res.status(500).json({
      error: "Failed to retrieve attempt"
    });
  }
});

module.exports = router;
