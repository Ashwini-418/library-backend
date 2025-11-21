const express = require("express");
const cors = require("cors");
const pool = require("./config/db");
require("dotenv").config();

const authRoutes = require("./routes/auth");
const bookRoutes = require("./routes/books");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Test database connection
pool.query("SELECT NOW()", (err, res) => {
  if (err) {
    console.error("Database connection error:", err);
  } else {
    console.log("Database connected successfully");
  }
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/books", bookRoutes);

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
