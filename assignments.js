require("dotenv").config();

const express = require("express");
const jwt = require("jsonwebtoken");
const { Pool } = require("pg");

const router = express.Router();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// Verify JWT token
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

// Create an assignment (admin only)
router.post("/", authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        error: "Only admins can create assignments"
      });
    }

    const { title, description, time_limit_minutes } = req.body;

    if (
      typeof title !== "string" || !title.trim() ||
      typeof description !== "string" || !description.trim() ||
      !Number.isInteger(time_limit_minutes) ||
      time_limit_minutes <= 0
    ) {
      return res.status(400).json({
        error: "Provide a title, description, and positive integer time limit"
      });
    }

    const result = await pool.query(
      `INSERT INTO assignments
       (title, description, time_limit_minutes, created_by)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [
        title.trim(),
        description.trim(),
        time_limit_minutes,
        req.user.id
      ]
    );

    res.status(201).json({
      message: "Assignment created successfully",
      assignment: result.rows[0]
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({
      error: "Failed to create assignment"
    });
  }
});
// Get all assignments
router.get("/", authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, title, description,
              time_limit_minutes, created_at
       FROM assignments
       ORDER BY id DESC`
    );

    res.json({
      message: "Assignments retrieved successfully",
      assignments: result.rows
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({
      error: "Failed to retrieve assignments"
    });
  }
});
// Start a timed assignment attempt (student only)
router.post("/:assignmentId/attempts", authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== "student") {
      return res.status(403).json({
        error: "Only students can start an assignment"
      });
    }

    const assignmentId = Number(req.params.assignmentId);

    if (!Number.isInteger(assignmentId) || assignmentId <= 0) {
      return res.status(400).json({
        error: "Invalid assignment ID"
      });
    }

    // Find the assignment
    const assignmentResult = await pool.query(
      `SELECT id, title, time_limit_minutes
       FROM assignments
       WHERE id = $1`,
      [assignmentId]
    );

    if (assignmentResult.rows.length === 0) {
      return res.status(404).json({
        error: "Assignment not found"
      });
    }

    const assignment = assignmentResult.rows[0];

    // Create an attempt and calculate its deadline
    const attemptResult = await pool.query(
      `INSERT INTO attempts
       (user_id, assignment_id, started_at, deadline)
       VALUES (
         $1,
         $2,
         NOW(),
         NOW() + ($3 * INTERVAL '1 minute')
       )
       RETURNING id, user_id, assignment_id,
                 started_at, deadline, status`,
      [
        req.user.id,
        assignment.id,
        assignment.time_limit_minutes
      ]
    );

    res.status(201).json({
      message: "Assignment attempt started successfully",
      assignment: assignment,
      attempt: attemptResult.rows[0]
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({
      error: "Failed to start assignment attempt"
    });
  }
});
router.post(
  "/:assignmentId/attempts/:attemptId/submit",
  authenticateToken,
  async (req, res) => {
    try {
      const assignmentId = Number(req.params.assignmentId);
      const attemptId = Number(req.params.attemptId);
      const { answer, answer_link } = req.body;

      // Validate input
      if (
        !Number.isInteger(assignmentId) ||
        assignmentId <= 0 ||
        !Number.isInteger(attemptId) ||
        attemptId <= 0
      ) {
        return res.status(400).json({
          error: "Invalid assignment or attempt ID"
        });
      }

      if (
        typeof answer !== "string" ||
        !answer.trim() ||
        typeof answer_link !== "string" ||
        !answer_link.trim()
      ) {
        return res.status(400).json({
          error: "Answer and answer link are required"
        });
      }

      // Validate the answer link
      let parsedUrl;

      try {
        parsedUrl = new URL(answer_link);
      } catch {
        return res.status(400).json({
          error: "Please provide a valid answer link"
        });
      }

      if (!["http:", "https:"].includes(parsedUrl.protocol)) {
        return res.status(400).json({
          error: "Answer link must use HTTP or HTTPS"
        });
      }

      // Find this student's attempt
      const result = await pool.query(
        `SELECT *
         FROM attempts
         WHERE id = $1
           AND assignment_id = $2
           AND user_id = $3`,
        [attemptId, assignmentId, req.user.id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          error: "Attempt not found"
        });
      }

      const attempt = result.rows[0];

      if (attempt.status !== "in_progress") {
        return res.status(400).json({
          error: "This attempt is no longer in progress"
        });
      }

      // Check deadline using the database clock
      const deadlineCheck = await pool.query(
        `SELECT deadline <= NOW() AS expired
         FROM attempts
         WHERE id = $1`,
        [attempt.id]
      );

      if (deadlineCheck.rows[0].expired) {
        await pool.query(
          `UPDATE attempts
           SET status = 'timed_out'
           WHERE id = $1
             AND status = 'in_progress'`,
          [attempt.id]
        );

        return res.status(400).json({
          error: "The assignment deadline has passed"
        });
      }

      // Save the answer
            // Perform three basic checks
      const checks = {
        answer_provided: answer.trim().length > 0,
        minimum_length: answer.trim().length >= 50,
        valid_link: ["http:", "https:"].includes(parsedUrl.protocol)
      };

      // Calculate score out of 3
      const score = Object.values(checks)
        .filter(Boolean).length;

      // Save answer, link, score, and checks
      const updated = await pool.query(
        `UPDATE attempts
         SET answer = $1,
             answer_link = $2,
             submitted_at = NOW(),
             status = 'submitted',
             score = $3,
             checks = $4
         WHERE id = $5
           AND status = 'in_progress'
           AND deadline > NOW()
         RETURNING id, assignment_id, submitted_at,
                   status, score, checks`,
        [
          answer.trim(),
          parsedUrl.href,
          score,
          JSON.stringify(checks),
          attempt.id
        ]
      );

      if (updated.rows.length === 0) {
        return res.status(400).json({
          error: "The deadline has passed or the attempt is no longer active"
        });
      }

      return res.status(200).json({
        message: "Assignment submitted successfully",
        attempt: updated.rows[0]
      });

      return res.status(200).json({
        message: "Assignment submitted successfully",
        attempt: updated.rows[0]
      });
    } catch (error) {
      console.error(error.message);

      return res.status(500).json({
        error: "Failed to submit assignment"
      });
    }
  }
);

module.exports = router;