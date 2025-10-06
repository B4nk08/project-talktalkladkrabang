const mysql = require("mysql2/promise");
require("dotenv").config()

console.log(process.env.DB_HOST)

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  timezone: "+07:00" 
});


pool.getConnection()
  .then(() => console.log("✅ MySQL Pool connected"))
  .catch((err) => console.error("MySQL Pool connection error:", err));

module.exports = pool;
