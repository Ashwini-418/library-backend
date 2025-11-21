const bcrypt = require("bcryptjs");

const passwords = [
  { email: "admin1@library.com", password: "admin1" },
  { email: "admin2@library.com", password: "admin2" },
  { email: "admin3@library.com", password: "admin3" },
  { email: "user1@library.com", password: "user1" },
  { email: "user2@library.com", password: "user2" },
  { email: "user3@library.com", password: "user3" },
];

async function generateHashes() {
  console.log("-- SQL Update Queries with Hashed Passwords:\n");

  for (const user of passwords) {
    const hash = await bcrypt.hash(user.password, 10);
    console.log(
      `UPDATE users SET password = '${hash}' WHERE email = '${user.email}';`
    );
  }
}

generateHashes();
