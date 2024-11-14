const Pool = require("pg").Pool;

let pool;

if(process.env.HOSTING_SITE){
  pool = new Pool({
    connectionString: process.env.SUPABASE_DB
  });
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


const dbSetup = async function() {

  try {
    
    await pool.query(`
      CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

      CREATE TABLE IF NOT EXISTS Google_Tokens (
        google_id VARCHAR(32) PRIMARY KEY,
        access_token TEXT,
        refresh_token TEXT
      );

      CREATE TABLE IF NOT EXISTS Users (
        id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        google_id VARCHAR(32) UNIQUE REFERENCES Google_Tokens(google_id) ON DELETE CASCADE,
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

      CREATE TABLE IF NOT EXISTS Repos (
        id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        name VARCHAR(64) NOT NULL,
        user_id UUID REFERENCES Users(id) ON DELETE CASCADE NOT NULL,
        visibility repo_visibility DEFAULT 'public' NOT NULL,
        description TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
  
      CREATE TABLE IF NOT EXISTS Folders (
        id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        name VARCHAR(128) NOT NULL,
        parent_id UUID REFERENCES Folders(id) ON DELETE CASCADE, -- NULL if it's a root folder
        repo_id UUID REFERENCES Repos(id) ON DELETE CASCADE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS Files (
        id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        extension VARCHAR(8) NOT NULL,
        fileSize INT NOT NULL,
        repo_id UUID REFERENCES Repos(id) ON DELETE CASCADE NOT NULL,
        folder_id UUID REFERENCES Folders(id) ON DELETE CASCADE, -- NULL if the file is directly in the repository's root
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS Comments (
        id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        repo_id UUID REFERENCES Repos(id) ON DELETE CASCADE NOT NULL,
        user_id UUID REFERENCES Users(id) ON DELETE CASCADE NOT NULL,
        content TEXT NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS Courses (
        id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        user_id UUID REFERENCES Users(id) ON DELETE CASCADE NOT NULL,
        name VARCHAR(255) NOT NULL,
        link TEXT NOT NULL,
        description TEXT,
        created_at TIMESTAMP NOT NULL
      );

      CREATE TABLE IF NOT EXISTS Assignments (
        id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        course_id UUID REFERENCES Courses(id) ON DELETE CASCADE NOT NULL,
        title VARCHAR(255) NOT NULL,
        link TEXT NOT NULL,
        description TEXT,
        max_points INT,
        due_date TIMESTAMP NOT NULL,
        created_at TIMESTAMP NOT NULL
      );

      CREATE TABLE IF NOT EXISTS Buildings (
        id INT PRIMARY KEY,
        name VARCHAR(64) NOT NULL UNIQUE  -- e.g., 'CS', 'EE', 'Multi-purpose'
      );

      CREATE TABLE IF NOT EXISTS Floors (
        id INT PRIMARY KEY,
        building_id INT NOT NULL REFERENCES Buildings(id) ON DELETE CASCADE,
        name VARCHAR(16) NOT NULL,
        level INT NOT NULL,   -- Floor level, e.g., 1, 2, 3
        UNIQUE(building_id, level)  -- Ensures no duplicate floors within a building
      );

      CREATE TABLE IF NOT EXISTS Segments (
        id INT PRIMARY KEY,
        floor_id INT NOT NULL REFERENCES Floors(id) ON DELETE CASCADE,
        direction VARCHAR(3) NOT NULL,  -- e.g., 'UR' for Upper Right, or 'LR' for Lower Left, etc.
        UNIQUE(floor_id, direction)  -- Ensures no duplicate sections within a floor
      );

      CREATE TABLE IF NOT EXISTS Room_Types (
        code VARCHAR(4) PRIMARY KEY,  -- Code like 'BR', 'GR', etc.
        name VARCHAR(64) NOT NULL  -- e.g., Full name 'Boys Common Room', 'Classroom'
      );

      CREATE TABLE IF NOT EXISTS Rooms (
        id INT PRIMARY KEY,
        segment_id INT REFERENCES Segments(id) ON DELETE CASCADE,
        name VARCHAR(32) NOT NULL,  -- e.g., 'C-19', 'B-9'
        type VARCHAR(3) NOT NULL REFERENCES Room_Types(code) ON DELETE RESTRICT
      );

      CREATE TABLE IF NOT EXISTS Likes (
        user_id UUID REFERENCES Users(id) ON DELETE CASCADE,
        repo_id UUID REFERENCES Repos(id) ON DELETE CASCADE,
        PRIMARY KEY (user_id, repo_id)
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
  dbSetup,
  query
};