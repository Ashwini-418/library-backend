const pool = require("../config/db");

const Book = {
  findAll: async () => {
    const result = await pool.query(
      "SELECT *, total_stock, available_stock FROM books ORDER BY id"
    );
    return result.rows;
  },

  create: async (title, author, initialStock = 1) => {
    const result = await pool.query(
      "INSERT INTO books (title, author, total_stock, available_stock) VALUES ($1, $2, $3, $3) RETURNING *",
      [title, author, initialStock]
    );
    return result.rows[0];
  },

  delete: async (id) => {
    // Check if book has active issues before deleting
    const activeIssues = await pool.query(
      "SELECT COUNT(*) FROM book_issues WHERE book_id = $1 AND returned_at IS NULL",
      [id]
    );

    if (parseInt(activeIssues.rows[0].count) > 0) {
      throw new Error("Cannot delete book with active issues");
    }

    const result = await pool.query(
      "DELETE FROM books WHERE id = $1 RETURNING *",
      [id]
    );
    return result.rows[0];
  },

  issue: async (bookId, userId) => {
    // Start transaction
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      // Check if book has available stock
      const bookCheck = await client.query(
        "SELECT available_stock FROM books WHERE id = $1",
        [bookId]
      );

      if (!bookCheck.rows[0] || bookCheck.rows[0].available_stock <= 0) {
        throw new Error("No copies available");
      }

      // Check if user already has this book
      const userCheck = await client.query(
        "SELECT COUNT(*) FROM book_issues WHERE book_id = $1 AND user_id = $2 AND returned_at IS NULL",
        [bookId, userId]
      );

      if (parseInt(userCheck.rows[0].count) > 0) {
        throw new Error("User already has this book");
      }

      // Update book stock
      await client.query(
        "UPDATE books SET available_stock = available_stock - 1 WHERE id = $1",
        [bookId]
      );

      // Create book issue record
      const issueResult = await client.query(
        "INSERT INTO book_issues (book_id, user_id) VALUES ($1, $2) RETURNING *",
        [bookId, userId]
      );

      // Get updated book info
      const bookResult = await client.query(
        "SELECT * FROM books WHERE id = $1",
        [bookId]
      );

      await client.query("COMMIT");

      return {
        book: bookResult.rows[0],
        issue: issueResult.rows[0],
      };
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  },

  return: async (bookId, userId) => {
    // Start transaction
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      // Check if user actually has this book issued
      const issueCheck = await client.query(
        "SELECT * FROM book_issues WHERE book_id = $1 AND user_id = $2 AND returned_at IS NULL",
        [bookId, userId]
      );

      if (issueCheck.rows.length === 0) {
        throw new Error("Book not issued to this user");
      }

      // Update issue record with return date
      await client.query(
        "UPDATE book_issues SET returned_at = NOW() WHERE book_id = $1 AND user_id = $2 AND returned_at IS NULL",
        [bookId, userId]
      );

      // Update book stock
      const bookResult = await client.query(
        "UPDATE books SET available_stock = available_stock + 1 WHERE id = $1 RETURNING *",
        [bookId]
      );

      await client.query("COMMIT");

      return bookResult.rows[0];
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  },

  addStock: async (id, additionalStock) => {
    const result = await pool.query(
      "UPDATE books SET total_stock = total_stock + $1, available_stock = available_stock + $1 WHERE id = $2 RETURNING *",
      [additionalStock, id]
    );
    return result.rows[0];
  },

  findByUser: async (userId) => {
    const result = await pool.query(
      `SELECT b.*, bi.issued_at, bi.returned_at 
       FROM books b 
       JOIN book_issues bi ON b.id = bi.book_id 
       WHERE bi.user_id = $1 AND bi.returned_at IS NULL 
       ORDER BY bi.issued_at DESC`,
      [userId]
    );
    return result.rows;
  },
};

module.exports = Book;
