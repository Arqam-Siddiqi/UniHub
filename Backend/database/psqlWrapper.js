const Pool = require("pg").Pool;

let pool;

if(process.env.HOSTING_SITE === 'https://unihub-86y9.onrender.com'){
  pool = new Pool({
    connectionString: "postgresql://unihub:gKXmdgfuVsk1h5ockYv9gaNjqVvlZnm8@dpg-crslt9jtq21c73dgpb6g-a.singapore-postgres.render.com/unihub_rdpy" + "?sslmode=require"
  });
}
else if(process.env.HOSTING_SITE === 'https://unihub-backend.vercel.app'){
  pool = new Pool({
    connectionString: "postgres://default:7AZPRsYb9pkD@ep-bold-dust-a1jl4jiz.ap-southeast-1.aws.neon.tech:5432/verceldb?sslmode=require"
  })
}
else{
  pool = new Pool({
    user: "postgres",
    host: "localhost",
    database: "unihub",
    password: "fast",
    port: 5432,
  });  
}


const setup = async function() {

  try {
    
    await pool.query(`
      CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

      CREATE TABLE IF NOT EXISTS Users (
        id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        google_id VARCHAR(64) UNIQUE,
        name VARCHAR(64) NOT NULL,
        password VARCHAR(72),
        email VARCHAR(64) UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
  
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'repo_visibility') THEN
          CREATE TYPE repo_visibility AS ENUM ('public', 'private');
        END IF;
      END $$;

      CREATE TABLE IF NOT EXISTS repos (
        id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        name VARCHAR(64) NOT NULL,
        user_id UUID REFERENCES users(id) NOT NULL,
        visibility repo_visibility DEFAULT 'public',
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
  
      CREATE TABLE IF NOT EXISTS folders (
        id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        name VARCHAR(128) NOT NULL,
        parent_id UUID REFERENCES folders(id), -- NULL if it's a root folder
        repo_id UUID REFERENCES repos(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS files (
        id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        name VARCHAR(255),
        path TEXT, -- Storing the actual file
        folder_id UUID REFERENCES folders(id), -- NULL if the file is directly in the repository's root
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      `
    )
  }
  catch(error){
    console.log("Error:", error.message);
  }

}

const query = async (text, values) => {
  return await pool.query(text, values);
}

module.exports = {
  setup,
  query
};