
require("dotenv").config();

const express = require("express");
const { Pool } = require("pg");
const authRoutes = require("./auth");
const assignmentRoutes = require("./assignments");
const attemptRoutes = require("./attempts");

const app = express();
app.use(express.json());
app.use("/api/assignments", assignmentRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/assigments",assignmentRoutes);
app.use("/api/attempts", attemptRoutes);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// Check whether the server is running
app.get("/", (req, res) => {
  res.json({
    message: "Assignment Backend API is running!"
  });
});

// Check PostgreSQL connection
app.get("/db-check", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.json({
      message: "Database connected successfully!",
      time: result.rows[0].now
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({
      error: "Database connection failed"
    });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
