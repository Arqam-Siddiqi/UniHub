const Pool = require("pg").Pool;

const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "unihub",
  password: "fast",
  port: 5432,
});

const setup = async () => {
  await pool.query(`
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
      
    CREATE TABLE IF NOT EXISTS Users (
      user_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      name VARCHAR(100) NOT NULL
    );
    `
  )
}

const query = async (query, params) => {
  
  await setup();

  return await pool.query(query, params);
}

module.exports = query;