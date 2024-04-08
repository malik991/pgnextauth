//import pg from "pg";
import { Pool } from "pg";

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT || "5432"),
});

// Handling connection event
pool.on("connect", () => {
  console.log("Connected to the database");
});
pool.on("error", (err) => {
  console.log("Error to connect Db", err);
});

export default pool;

// const db = new pg.Client({
//   user: "postgres",
//   host: "localhost",
//   database: "nextAuthDb",
//   password: "root",
//   port: 5432,
// });

// export async function dbConnect() {
//   try {
//     await db.connect();
//     console.log("PostgreSQL connected successfully");
//   } catch (error) {
//     console.error("Error connecting to PostgreSQL:", error);
//     process.exit(1); // Exit the process if connection fails
//   }
// }

//export default db;
