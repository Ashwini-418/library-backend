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
    const { title, author, initialStock = 1 } = req.body;

    if (!title || !author) {
      return res.status(400).json({ error: "Title and author are required" });
    }

    if (initialStock < 1) {
      return res
        .status(400)
        .json({ error: "Initial stock must be at least 1" });
    }

    const book = await Book.create(title, author, initialStock);
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
    if (error.message === "Cannot delete book with active issues") {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: "Server error" });
  }
});

// Issue book (user only)
router.post("/issue/:id", authMiddleware, userOnly, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await Book.issue(id, req.user.userId);

    res.json({
      message: "Book issued successfully",
      book: result.book,
      issue: result.issue,
    });
  } catch (error) {
    console.error("Issue book error:", error);
    if (error.message === "No copies available") {
      return res.status(400).json({ error: "No copies available" });
    }
    if (error.message === "User already has this book") {
      return res.status(400).json({ error: "You already have this book" });
    }
    res.status(500).json({ error: "Server error" });
  }
});

// Return book (user only)
router.post("/return/:id", authMiddleware, userOnly, async (req, res) => {
  try {
    const { id } = req.params;
    const book = await Book.return(id, req.user.userId);

    res.json({ message: "Book returned successfully", book });
  } catch (error) {
    console.error("Return book error:", error);
    if (error.message === "Book not issued to this user") {
      return res.status(400).json({ error: "You don't have this book issued" });
    }
    res.status(500).json({ error: "Server error" });
  }
});

// Add stock (admin only)
router.post("/:id/add-stock", authMiddleware, adminOnly, async (req, res) => {
  try {
    const { id } = req.params;
    const { additionalStock } = req.body;

    if (!additionalStock || additionalStock < 1) {
      return res
        .status(400)
        .json({ error: "Additional stock must be at least 1" });
    }

    const book = await Book.addStock(id, additionalStock);

    if (!book) {
      return res.status(404).json({ error: "Book not found" });
    }

    res.json({ message: `Added ${additionalStock} copies successfully`, book });
  } catch (error) {
    console.error("Add stock error:", error);
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
