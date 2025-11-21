const pool = require("../config/db");

const Book = {
  findAll: async () => {
    const result = await pool.query("SELECT * FROM books ORDER BY id");
    return result.rows;
  },

  create: async (title, author) => {
    const result = await pool.query(
      "INSERT INTO books (title, author) VALUES ($1, $2) RETURNING *",
      [title, author]
    );
    return result.rows[0];
  },

  delete: async (id) => {
    const result = await pool.query(
      "DELETE FROM books WHERE id = $1 RETURNING *",
      [id]
    );
    return result.rows[0];
  },

  issue: async (bookId, userId) => {
    const result = await pool.query(
      "UPDATE books SET issued_to = $1, issued_at = NOW() WHERE id = $2 AND issued_to IS NULL RETURNING *",
      [userId, bookId]
    );
    return result.rows[0];
  },

  findByUser: async (userId) => {
    const result = await pool.query(
      "SELECT * FROM books WHERE issued_to = $1 ORDER BY issued_at DESC",
      [userId]
    );
    return result.rows;
  },
};

module.exports = Book;
