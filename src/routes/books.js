const express = require("express");
const Book = require("../models/Book");
const { authMiddleware, adminOnly, userOnly } = require("../middleware/auth");

const router = express.Router();

// Get all books (authenticated users)
router.get("/", authMiddleware, async (req, res) => {
  try {
    const books = await Book.findAll();
    res.json(books);
  } catch (error) {
    console.error("Get books error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Add book (admin only)
router.post("/", authMiddleware, adminOnly, async (req, res) => {
  try {
    const { title, author } = req.body;

    if (!title || !author) {
      return res.status(400).json({ error: "Title and author are required" });
    }

    const book = await Book.create(title, author);
    res.status(201).json(book);
  } catch (error) {
    console.error("Add book error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Delete book (admin only)
router.delete("/:id", authMiddleware, adminOnly, async (req, res) => {
  try {
    const { id } = req.params;
    const book = await Book.delete(id);

    if (!book) {
      return res.status(404).json({ error: "Book not found" });
    }

    res.json({ message: "Book deleted successfully" });
  } catch (error) {
    console.error("Delete book error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Issue book (user only)
router.post("/issue/:id", authMiddleware, userOnly, async (req, res) => {
  try {
    const { id } = req.params;
    const book = await Book.issue(id, req.user.userId);

    if (!book) {
      return res
        .status(400)
        .json({ error: "Book already issued or not found" });
    }

    res.json({ message: "Book issued successfully", book });
  } catch (error) {
    console.error("Issue book error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Get my issued books (user only)
router.get("/my", authMiddleware, userOnly, async (req, res) => {
  try {
    const books = await Book.findByUser(req.user.userId);
    res.json(books);
  } catch (error) {
    console.error("Get my books error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
