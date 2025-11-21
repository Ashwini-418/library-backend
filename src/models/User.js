const pool = require("../config/db");

const User = {
  findByEmail: async (email) => {
    const result = await pool.query(
      "SELECT id, name, email, password, role FROM users WHERE email = $1",
      [email]
    );
    return result.rows[0];
  },
};

module.exports = User;
