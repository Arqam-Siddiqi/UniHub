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
        description TEXT,
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
        google_file_id VARCHAR(255) UNIQUE,
        mimeType VARCHAR(128) NOT NULL,
        repo_id UUID REFERENCES Repos(id) ON DELETE CASCADE NOT NULL,
        folder_id UUID REFERENCES Folders(id) ON DELETE CASCADE, -- NULL if the file is directly in the repository's root
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (id, google_file_id)
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
        name VARCHAR(255) NOT NULL,
        link TEXT NOT NULL UNIQUE,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS User_Courses (
        user_id UUID REFERENCES Users(id) ON DELETE CASCADE NOT NULL,
        course_id UUID REFERENCES Courses(id) ON DELETE CASCADE NOT NULL,
        PRIMARY KEY (user_id, course_id)
      );

      CREATE TABLE IF NOT EXISTS Assignments (
        id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        course_id UUID REFERENCES Courses(id) ON DELETE CASCADE NOT NULL,
        title VARCHAR(255) NOT NULL,
        link TEXT NOT NULL UNIQUE,
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
        level INT NOT NULL   -- Floor level, e.g., 1, 2, 3
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
        segment_id INT NOT NULL REFERENCES Segments(id) ON DELETE CASCADE,
        name VARCHAR(64) NOT NULL,  -- e.g., 'C-19', 'B-9'
        type VARCHAR(4) NOT NULL REFERENCES Room_Types(code) ON DELETE RESTRICT
      );

      CREATE TABLE IF NOT EXISTS Faculty (
        name VARCHAR(128) NOT NULL,
        room_id INT NOT NULL REFERENCES Rooms(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS Likes (
        user_id UUID REFERENCES Users(id) ON DELETE CASCADE,
        repo_id UUID REFERENCES Repos(id) ON DELETE CASCADE,
        PRIMARY KEY (user_id, repo_id)
      );

      CREATE TABLE IF NOT EXISTS Tags (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        name VARCHAR(96) NOT NULL UNIQUE
      );

      CREATE TABLE IF NOT EXISTS Repo_Tags (
        repo_id UUID NOT NULL REFERENCES Repos(id) ON DELETE CASCADE,
        tag_id UUID NOT NULL REFERENCES Tags(id) ON DELETE CASCADE,
        PRIMARY KEY (repo_id, tag_id)
      );
      `
    )

    await mapSetup();
  }
  catch(error){
    console.log("Error:", error.message);
  }

}

const query = async (text, values) => {
  return await pool.query(text, values);
}

const mapSetup = async () => {

  try{

    await pool.query(`
      BEGIN;
  
      DO $$
      BEGIN
          IF NOT EXISTS (SELECT 1 FROM buildings) THEN
            
            INSERT INTO buildings (id,name) VALUES (1,'Computer Science');
            INSERT INTO buildings (id,name) VALUES (2,'Electrical Engineering');
            INSERT INTO buildings (id,name) VALUES (3,'Multi-purpose');
  
            --select * from buildings;
  
            INSERT INTO Floors (id,building_id,name,level) VALUES (0,1, 'Basement 1' , 0);
  
            INSERT INTO Floors (id,building_id,name,level) VALUES (1,1, 'Basement 2' , 0);
            INSERT INTO Floors (id,building_id,name,level) VALUES (2,1, 'Ground' , 1);
            INSERT INTO Floors (id,building_id,name,level) VALUES (3,1, 'First' , 2);
  
            INSERT INTO Floors (id,building_id,name,level) VALUES (4,2, 'A' , 1);
            INSERT INTO Floors (id,building_id,name,level) VALUES (5,2, 'B' , 2);
            INSERT INTO Floors (id,building_id,name,level) VALUES (6,2, 'C' , 3);
            INSERT INTO Floors (id,building_id,name,level) VALUES (7,2, 'D' , 4);
            INSERT INTO Floors (id,building_id,name,level) VALUES (8,2, 'E' , 5);
  
  
            INSERT INTO Floors (id,building_id,name,level) VALUES (9,3, 'Basement' , 0);
            INSERT INTO Floors (id,building_id,name,level) VALUES (10,3, 'Ground' , 1);
            INSERT INTO Floors (id,building_id,name,level) VALUES (11,3, 'First' , 2); 
  
            --select * from floors;
            INSERT INTO segments (id,floor_id, direction) VALUES (1,(SELECT id FROM Floors WHERE name='Basement 1' and level=0 and building_id=(SELECT id FROM buildings WHERE name='Computer Science')), 'UR');
            INSERT INTO segments (id,floor_id, direction) VALUES (2,(SELECT id FROM Floors WHERE name='Basement 2' and level=0 and building_id=(SELECT id FROM buildings WHERE name='Computer Science')), 'UL');
            INSERT INTO segments (id,floor_id, direction) VALUES (3,(SELECT id FROM Floors WHERE name='Basement 1' and level=0 and building_id=(SELECT id FROM buildings WHERE name='Computer Science')), 'LR');
            INSERT INTO segments (id,floor_id, direction) VALUES (4,(SELECT id FROM Floors WHERE name='Basement 2' and level=0 and building_id=(SELECT id FROM buildings WHERE name='Computer Science')), 'LL');
  
            INSERT INTO segments (id,floor_id, direction) VALUES (5,(SELECT id FROM Floors WHERE level=1 and building_id=(SELECT id FROM buildings WHERE name='Computer Science')), 'UR');
            INSERT INTO segments (id,floor_id, direction) VALUES (6,(SELECT id FROM Floors WHERE level=1 and building_id=(SELECT id FROM buildings WHERE name='Computer Science')), 'UL');
            INSERT INTO segments (id,floor_id, direction) VALUES (7,(SELECT id FROM Floors WHERE level=1 and building_id=(SELECT id FROM buildings WHERE name='Computer Science')), 'LR');
            INSERT INTO segments (id,floor_id, direction) VALUES (8,(SELECT id FROM Floors WHERE level=1 and building_id=(SELECT id FROM buildings WHERE name='Computer Science')), 'LL');
  
            INSERT INTO segments (id,floor_id, direction) VALUES (9,(SELECT id FROM Floors WHERE level=2 and building_id=(SELECT id FROM buildings WHERE name='Computer Science')), 'UR');
            INSERT INTO segments (id,floor_id, direction) VALUES (10,(SELECT id FROM Floors WHERE level=2 and building_id=(SELECT id FROM buildings WHERE name='Computer Science')), 'UL');
            INSERT INTO segments (id,floor_id, direction) VALUES (11,(SELECT id FROM Floors WHERE level=2 and building_id=(SELECT id FROM buildings WHERE name='Computer Science')), 'LR');
            INSERT INTO segments (id,floor_id, direction) VALUES (12,(SELECT id FROM Floors WHERE level=2 and building_id=(SELECT id FROM buildings WHERE name='Computer Science')), 'LL');
  
  
  
            INSERT INTO segments (id,floor_id, direction) VALUES (13,(SELECT id FROM Floors WHERE name='A' and building_id=(SELECT id FROM buildings WHERE name='Electrical Engineering')), 'UR');
            INSERT INTO segments (id,floor_id, direction) VALUES (14,(SELECT id FROM Floors WHERE name='A' and building_id=(SELECT id FROM buildings WHERE name='Electrical Engineering')), 'UL');
            INSERT INTO segments (id,floor_id, direction) VALUES (15,(SELECT id FROM Floors WHERE name='A' and building_id=(SELECT id FROM buildings WHERE name='Electrical Engineering')), 'LR');
            INSERT INTO segments (id,floor_id, direction) VALUES (16,(SELECT id FROM Floors WHERE name='A' and building_id=(SELECT id FROM buildings WHERE name='Electrical Engineering')), 'LL');
  
            INSERT INTO segments (id,floor_id, direction) VALUES (17,(SELECT id FROM Floors WHERE name='B' and building_id=(SELECT id FROM buildings WHERE name='Electrical Engineering')), 'UR');
            INSERT INTO segments (id,floor_id, direction) VALUES (18,(SELECT id FROM Floors WHERE name='B' and building_id=(SELECT id FROM buildings WHERE name='Electrical Engineering')), 'UL');
            INSERT INTO segments (id,floor_id, direction) VALUES (19,(SELECT id FROM Floors WHERE name='B' and building_id=(SELECT id FROM buildings WHERE name='Electrical Engineering')), 'LR');
            INSERT INTO segments (id,floor_id, direction) VALUES (20,(SELECT id FROM Floors WHERE name='B' and building_id=(SELECT id FROM buildings WHERE name='Electrical Engineering')), 'LL');
  
            INSERT INTO segments (id,floor_id, direction) VALUES (21,(SELECT id FROM Floors WHERE name='C' and building_id=(SELECT id FROM buildings WHERE name='Electrical Engineering')), 'UR');
            INSERT INTO segments (id,floor_id, direction) VALUES (22,(SELECT id FROM Floors WHERE name='C' and building_id=(SELECT id FROM buildings WHERE name='Electrical Engineering')), 'UL');
            INSERT INTO segments (id,floor_id, direction) VALUES (23,(SELECT id FROM Floors WHERE name='C' and building_id=(SELECT id FROM buildings WHERE name='Electrical Engineering')), 'LR');
            INSERT INTO segments (id,floor_id, direction) VALUES (24,(SELECT id FROM Floors WHERE name='C' and building_id=(SELECT id FROM buildings WHERE name='Electrical Engineering')), 'LL');
  
            INSERT INTO segments (id,floor_id, direction) VALUES (25,(SELECT id FROM Floors WHERE name='D' and building_id=(SELECT id FROM buildings WHERE name='Electrical Engineering')), 'UR');
            INSERT INTO segments (id,floor_id, direction) VALUES (26,(SELECT id FROM Floors WHERE name='D' and building_id=(SELECT id FROM buildings WHERE name='Electrical Engineering')), 'UL');
            INSERT INTO segments (id,floor_id, direction) VALUES (27,(SELECT id FROM Floors WHERE name='D' and building_id=(SELECT id FROM buildings WHERE name='Electrical Engineering')), 'LR');
            INSERT INTO segments (id,floor_id, direction) VALUES (28,(SELECT id FROM Floors WHERE name='D' and building_id=(SELECT id FROM buildings WHERE name='Electrical Engineering')), 'LL');
  
            INSERT INTO segments (id,floor_id, direction) VALUES (29,(SELECT id FROM Floors WHERE name='E' and building_id=(SELECT id FROM buildings WHERE name='Electrical Engineering')), 'UR');
            INSERT INTO segments (id,floor_id, direction) VALUES (30,(SELECT id FROM Floors WHERE name='E' and building_id=(SELECT id FROM buildings WHERE name='Electrical Engineering')), 'UL');
            INSERT INTO segments (id,floor_id, direction) VALUES (31,(SELECT id FROM Floors WHERE name='E' and building_id=(SELECT id FROM buildings WHERE name='Electrical Engineering')), 'LR');
            INSERT INTO segments (id,floor_id, direction) VALUES (32,(SELECT id FROM Floors WHERE name='E' and building_id=(SELECT id FROM buildings WHERE name='Electrical Engineering')), 'LL');
  
  
            INSERT INTO segments (id,floor_id, direction) VALUES (33,(SELECT id FROM Floors WHERE level=0 and building_id=(SELECT id FROM buildings WHERE name='Multi-purpose')), 'UR');
            INSERT INTO segments (id,floor_id, direction) VALUES (34,(SELECT id FROM Floors WHERE level=0 and building_id=(SELECT id FROM buildings WHERE name='Multi-purpose')), 'UL');
            INSERT INTO segments (id,floor_id, direction) VALUES (35,(SELECT id FROM Floors WHERE level=0 and building_id=(SELECT id FROM buildings WHERE name='Multi-purpose')), 'LR');
            INSERT INTO segments (id,floor_id, direction) VALUES (36,(SELECT id FROM Floors WHERE level=0 and building_id=(SELECT id FROM buildings WHERE name='Multi-purpose')), 'LL');
  
            INSERT INTO segments (id,floor_id, direction) VALUES (37,(SELECT id FROM Floors WHERE level=1 and building_id=(SELECT id FROM buildings WHERE name='Multi-purpose')), 'UR');
            INSERT INTO segments (id,floor_id, direction) VALUES (38,(SELECT id FROM Floors WHERE level=1 and building_id=(SELECT id FROM buildings WHERE name='Multi-purpose')), 'UL');
            INSERT INTO segments (id,floor_id, direction) VALUES (39,(SELECT id FROM Floors WHERE level=1 and building_id=(SELECT id FROM buildings WHERE name='Multi-purpose')), 'LR');
            INSERT INTO segments (id,floor_id, direction) VALUES (40,(SELECT id FROM Floors WHERE level=1 and building_id=(SELECT id FROM buildings WHERE name='Multi-purpose')), 'LL');
  
            INSERT INTO segments (id,floor_id, direction) VALUES (41,(SELECT id FROM Floors WHERE level=2 and building_id=(SELECT id FROM buildings WHERE name='Multi-purpose')), 'UR');
            INSERT INTO segments (id,floor_id, direction) VALUES (42,(SELECT id FROM Floors WHERE level=2 and building_id=(SELECT id FROM buildings WHERE name='Multi-purpose')), 'UL');
            INSERT INTO segments (id,floor_id, direction) VALUES (43,(SELECT id FROM Floors WHERE level=2 and building_id=(SELECT id FROM buildings WHERE name='Multi-purpose')), 'LR');
            INSERT INTO segments (id,floor_id, direction) VALUES (44,(SELECT id FROM Floors WHERE level=2 and building_id=(SELECT id FROM buildings WHERE name='Multi-purpose')), 'LL');
  
            INSERT INTO segments (id,floor_id, direction) VALUES (45,(SELECT id FROM Floors WHERE level=1 and building_id=(SELECT id FROM buildings WHERE name='Electrical Engineering')), 'M');
  
            INSERT INTO segments (id,floor_id, direction) VALUES (46,(SELECT id FROM Floors WHERE name='Basement 2' and level=0 and building_id=(SELECT id FROM buildings WHERE name='Computer Science')), 'LM');
            INSERT INTO segments (id,floor_id, direction) VALUES (47,(SELECT id FROM Floors WHERE name='Basement 1' and level=0 and building_id=(SELECT id FROM buildings WHERE name='Computer Science')), 'RM');
  
            INSERT INTO segments (id,floor_id, direction) VALUES (48,(SELECT id FROM Floors WHERE level=0 and building_id=(SELECT id FROM buildings WHERE name='Multi-purpose')), 'M');
            INSERT INTO segments (id,floor_id, direction) VALUES (49,(SELECT id FROM Floors WHERE level=1 and building_id=(SELECT id FROM buildings WHERE name='Multi-purpose')), 'M');
            INSERT INTO segments (id,floor_id, direction) VALUES (50,(SELECT id FROM Floors WHERE level=2 and building_id=(SELECT id FROM buildings WHERE name='Multi-purpose')), 'M');
            INSERT INTO segments (id,floor_id, direction) VALUES (51,(SELECT id FROM Floors WHERE level=3 and building_id=(SELECT id FROM buildings WHERE name='Electrical Engineering')), 'M');
  
            --select * from segments;
  
            INSERT INTO room_types (code, name) VALUES ('FR','Faculty Room');
            INSERT INTO room_types (code, name) VALUES ('BCR','Boys Common Room');
            INSERT INTO room_types (code, name) VALUES ('GCR','Girls Common Room');
            INSERT INTO room_types (code, name) VALUES ('WR','Wash Room');
            INSERT INTO room_types (code, name) VALUES ('PR','Prayer Room');
            INSERT INTO room_types (code, name) VALUES ('SR','Study Room');
            INSERT INTO room_types (code, name) VALUES ('LR','Lab Room');
            INSERT INTO room_types (code, name) VALUES ('CR','Conference Room');
            INSERT INTO room_types (code, name) VALUES ('AR','Auditorium');
            INSERT INTO room_types (code, name) VALUES ('PtR','Game Room');
            INSERT INTO room_types (code, name) VALUES ('Cafe','Cafeteria');
            INSERT INTO room_types (code, name) VALUES ('Adm','Administration');
  
            INSERT INTO room_types (code, name) VALUES ('WS','Workshop');
            INSERT INTO room_types (code, name) VALUES ('GR','Guest Room');
            INSERT INTO room_types (code, name) VALUES ('ER','Empty Room');
            INSERT INTO room_types (code, name) VALUES ('LH','Library Hall');
            INSERT INTO room_types (code, name) VALUES ('OC','Operation center');
            INSERT INTO room_types (code, name) VALUES ('DEP','Department');
            INSERT INTO room_types (code, name) VALUES ('HEAD','Heads');
  
  
            --select * from room_types;
  
            --EE rooms
  
            INSERT INTO Rooms  (id,segment_id, name, type) VALUES (1,(SELECT id FROM segments WHERE floor_id=4 and direction='UL'), 'Female wash room', 'WR');
            INSERT INTO Rooms  (id,segment_id, name, type) VALUES (2,(SELECT id FROM segments WHERE floor_id=4 and direction='UL'), 'Microprocessing lab', 'LR');
            INSERT INTO Rooms  (id,segment_id, name, type) VALUES (3,(SELECT id FROM segments WHERE floor_id=4 and direction='UL'), 'Control Lab', 'LR');
            INSERT INTO Rooms  (id,segment_id, name, type) VALUES (4,(SELECT id FROM segments WHERE floor_id=4 and direction='UL'), 'Engineering Workshop', 'WS');
  
            INSERT INTO Rooms  (id,segment_id, name, type) VALUES (5,(SELECT id FROM segments WHERE floor_id=4 and direction='M'), 'BCR', 'BCR');
  
            INSERT INTO Rooms  (id,segment_id, name, type) VALUES (6,(SELECT id FROM segments WHERE floor_id=4 and direction='UR'), 'Faculty Office', 'FR');
            INSERT INTO Rooms  (id,segment_id, name, type) VALUES (7,(SELECT id FROM segments WHERE floor_id=4 and direction='UR'), 'A3', 'SR');
            INSERT INTO Rooms  (id,segment_id, name, type) VALUES (8,(SELECT id FROM segments WHERE floor_id=4 and direction='UR'), 'A2', 'SR');
            INSERT INTO Rooms  (id,segment_id, name, type) VALUES (9,(SELECT id FROM segments WHERE floor_id=4 and direction='UR'), 'A1', 'SR');
            INSERT INTO Rooms  (id,segment_id, name, type) VALUES (10,(SELECT id FROM segments WHERE floor_id=4 and direction='UR'), 'Male wash room', 'WR');
  
            INSERT INTO Rooms  (id,segment_id, name, type) VALUES (11,(SELECT id FROM segments WHERE floor_id=4 and direction='LL'), 'A8', 'SR');
            INSERT INTO Rooms  (id,segment_id, name, type) VALUES (12,(SELECT id FROM segments WHERE floor_id=4 and direction='LL'), 'A7', 'SR');
            INSERT INTO Rooms  (id,segment_id, name, type) VALUES (13,(SELECT id FROM segments WHERE floor_id=4 and direction='LL'), 'A6', 'SR');
            INSERT INTO Rooms  (id,segment_id, name, type) VALUES (14,(SELECT id FROM segments WHERE floor_id=4 and direction='LL'), 'Postgraduate Lab', 'LR');
            INSERT INTO Rooms  (id,segment_id, name, type) VALUES (15,(SELECT id FROM segments WHERE floor_id=4 and direction='LL'), 'A5', 'SR');
  
            INSERT INTO Rooms  (id,segment_id, name, type) VALUES (16,(SELECT id FROM segments WHERE floor_id=4 and direction='LR'), 'Power Lab', 'LR');
            INSERT INTO Rooms  (id,segment_id, name, type) VALUES (17,(SELECT id FROM segments WHERE floor_id=4 and direction='LR'), 'A4', 'SR');
            INSERT INTO Rooms  (id,segment_id, name, type) VALUES (18,(SELECT id FROM segments WHERE floor_id=4 and direction='LR'), 'Lab 8', 'LR');
  
  
            INSERT INTO Rooms  (id,segment_id, name, type) VALUES (19,(SELECT id FROM segments WHERE floor_id=5 and direction='UL'), 'Male Faculty Wash room', 'WR');
            INSERT INTO Rooms  (id,segment_id, name, type) VALUES (20,(SELECT id FROM segments WHERE floor_id=5 and direction='UL'), 'Female Prayer Area', 'PR');
            INSERT INTO Rooms  (id,segment_id, name, type) VALUES (21,(SELECT id FROM segments WHERE floor_id=5 and direction='UL'), 'Faculty Office (S & H)', 'FR');
            INSERT INTO Rooms  (id,segment_id, name, type) VALUES (22,(SELECT id FROM segments WHERE floor_id=5 and direction='UL'), 'HOD office', 'HEAD');
  
  
            INSERT INTO Rooms  (id,segment_id, name, type) VALUES (23,(SELECT id FROM segments WHERE floor_id=5 and direction='UR'), 'Faculty Office (AI & DS)', 'FR');
            INSERT INTO Rooms  (id,segment_id, name, type) VALUES (24,(SELECT id FROM segments WHERE floor_id=5 and direction='UR'), 'Faculty Office (SOM 2)', 'FR');
            INSERT INTO Rooms  (id,segment_id, name, type) VALUES (25,(SELECT id FROM segments WHERE floor_id=5 and direction='UR'), 'Guest Room 1', 'GR');
            INSERT INTO Rooms  (id,segment_id, name, type) VALUES (26,(SELECT id FROM segments WHERE floor_id=5 and direction='UR'), 'Guest Room 2', 'GR');
            INSERT INTO Rooms  (id,segment_id, name, type) VALUES (27,(SELECT id FROM segments WHERE floor_id=5 and direction='UR'), 'Male Faculty Wash room', 'WR');
  
  
            INSERT INTO Rooms  (id,segment_id, name, type) VALUES (28,(SELECT id FROM segments WHERE floor_id=5 and direction='LL'), 'Faculty Office', 'FR');
            INSERT INTO Rooms  (id,segment_id, name, type) VALUES (29,(SELECT id FROM segments WHERE floor_id=5 and direction='LL'), 'Faculty Office (CYS)', 'FR');
  
  
            INSERT INTO Rooms  (id,segment_id, name, type) VALUES (30,(SELECT id FROM segments WHERE floor_id=5 and direction='LR'), 'Conference Room', 'CR');
            INSERT INTO Rooms  (id,segment_id, name, type) VALUES (31,(SELECT id FROM segments WHERE floor_id=5 and direction='LR'), 'B9', 'SR');
            INSERT INTO Rooms  (id,segment_id, name, type) VALUES (32,(SELECT id FROM segments WHERE floor_id=5 and direction='LR'), 'B10', 'SR');
            INSERT INTO Rooms  (id,segment_id, name, type) VALUES (33,(SELECT id FROM segments WHERE floor_id=5 and direction='LR'), 'B11', 'SR');
            INSERT INTO Rooms  (id,segment_id, name, type) VALUES (34,(SELECT id FROM segments WHERE floor_id=5 and direction='LR'), 'Faculty Office (SOM 1)', 'FR');
  
  
  
  
            INSERT INTO Rooms  (id,segment_id, name, type) VALUES (35,(SELECT id FROM segments WHERE floor_id=6 and direction='UL'), 'Male Wash room', 'WR');
            INSERT INTO Rooms  (id,segment_id, name, type) VALUES (36,(SELECT id FROM segments WHERE floor_id=6 and direction='UL'), 'Empty Room (for events)', 'ER');
            INSERT INTO Rooms  (id,segment_id, name, type) VALUES (37,(SELECT id FROM segments WHERE floor_id=6 and direction='UL'), 'C20', 'SR');
            INSERT INTO Rooms  (id,segment_id, name, type) VALUES (38,(SELECT id FROM segments WHERE floor_id=6 and direction='UL'), 'C21', 'SR');
  
            INSERT INTO Rooms  (id,segment_id, name, type) VALUES (39,(SELECT id FROM segments WHERE floor_id=6 and direction='UR'), 'C16', 'SR');
            INSERT INTO Rooms  (id,segment_id, name, type) VALUES (40,(SELECT id FROM segments WHERE floor_id=6 and direction='UR'), 'C15', 'SR');
            INSERT INTO Rooms  (id,segment_id, name, type) VALUES (41,(SELECT id FROM segments WHERE floor_id=6 and direction='UR'), 'Project Lab', 'LR');
            INSERT INTO Rooms  (id,segment_id, name, type) VALUES (42,(SELECT id FROM segments WHERE floor_id=6 and direction='UR'), 'Female Faculty Wash room', 'WR');
  
            INSERT INTO Rooms  (id,segment_id, name, type) VALUES (43,(SELECT id FROM segments WHERE floor_id=6 and direction='LL'), 'Lab 7', 'LR');
            INSERT INTO Rooms  (id,segment_id, name, type) VALUES (44,(SELECT id FROM segments WHERE floor_id=6 and direction='LL'), 'C19', 'SR');
            INSERT INTO Rooms  (id,segment_id, name, type) VALUES (45,(SELECT id FROM segments WHERE floor_id=6 and direction='LL'), 'C18', 'SR');
            INSERT INTO Rooms  (id,segment_id, name, type) VALUES (46,(SELECT id FROM segments WHERE floor_id=6 and direction='LL'), 'C17', 'SR');
  
  
            INSERT INTO Rooms  (id,segment_id, name, type) VALUES (47,(SELECT id FROM segments WHERE floor_id=6 and direction='LR'), 'C14', 'SR');
            INSERT INTO Rooms  (id,segment_id, name, type) VALUES (48,(SELECT id FROM segments WHERE floor_id=6 and direction='LR'), 'C13', 'SR');
            INSERT INTO Rooms  (id,segment_id, name, type) VALUES (49,(SELECT id FROM segments WHERE floor_id=6 and direction='LR'), 'C12', 'SR');
            INSERT INTO Rooms  (id,segment_id, name, type) VALUES (50,(SELECT id FROM segments WHERE floor_id=6 and direction='LR'), 'Faculty Office', 'FR');
  
  
            INSERT INTO Rooms  (id,segment_id, name, type) VALUES (51,(SELECT id FROM segments WHERE floor_id=7 and direction='UL'), 'Female Wash room', 'WR');
            INSERT INTO Rooms  (id,segment_id, name, type) VALUES (52,(SELECT id FROM segments WHERE floor_id=7 and direction='UL'), 'Library Reading Hall', 'LH');
            INSERT INTO Rooms  (id,segment_id, name, type) VALUES (53,(SELECT id FROM segments WHERE floor_id=7 and direction='UL'), 'Lab 10', 'LR');
  
  
            INSERT INTO Rooms  (id,segment_id, name, type) VALUES (54,(SELECT id FROM segments WHERE floor_id=7 and direction='UR'), 'Lab 8 (Networking & CYS lab)', 'LR');
            INSERT INTO Rooms  (id,segment_id, name, type) VALUES (55,(SELECT id FROM segments WHERE floor_id=7 and direction='UR'), 'Security Lab', 'LR');
            INSERT INTO Rooms  (id,segment_id, name, type) VALUES (56,(SELECT id FROM segments WHERE floor_id=7 and direction='UR'), 'Lab 9', 'LR');
            INSERT INTO Rooms  (id,segment_id, name, type) VALUES (57,(SELECT id FROM segments WHERE floor_id=7 and direction='UR'), 'Network Operation Center', 'OC');
            INSERT INTO Rooms  (id,segment_id, name, type) VALUES (58,(SELECT id FROM segments WHERE floor_id=7 and direction='UR'), 'Female Wash room', 'WR');
  
            INSERT INTO Rooms  (id,segment_id, name, type) VALUES (59,(SELECT id FROM segments WHERE floor_id=7 and direction='LL'), 'D28', 'SR');
            INSERT INTO Rooms  (id,segment_id, name, type) VALUES (60,(SELECT id FROM segments WHERE floor_id=7 and direction='LL'), 'D27', 'SR');
            INSERT INTO Rooms  (id,segment_id, name, type) VALUES (61,(SELECT id FROM segments WHERE floor_id=7 and direction='LL'), 'D26', 'SR');
            INSERT INTO Rooms  (id,segment_id, name, type) VALUES (62,(SELECT id FROM segments WHERE floor_id=7 and direction='LL'), 'D25', 'SR');
            INSERT INTO Rooms  (id,segment_id, name, type) VALUES (63,(SELECT id FROM segments WHERE floor_id=7 and direction='LL'), 'D24', 'SR');
  
            INSERT INTO Rooms  (id,segment_id, name, type) VALUES (64,(SELECT id FROM segments WHERE floor_id=7 and direction='LR'), 'D23', 'SR');
            INSERT INTO Rooms  (id,segment_id, name, type) VALUES (65,(SELECT id FROM segments WHERE floor_id=7 and direction='LR'), 'D22', 'SR');
            INSERT INTO Rooms  (id,segment_id, name, type) VALUES (66,(SELECT id FROM segments WHERE floor_id=7 and direction='LR'), 'GCR', 'GCR');
  
            INSERT INTO Rooms  (id,segment_id, name, type) VALUES (67,(SELECT id FROM segments WHERE floor_id=8 and direction='UL'), 'Male Wash room', 'WR');
            INSERT INTO Rooms  (id,segment_id, name, type) VALUES (68,(SELECT id FROM segments WHERE floor_id=8 and direction='UL'), 'Empty Room', 'ER');
            INSERT INTO Rooms  (id,segment_id, name, type) VALUES (69,(SELECT id FROM segments WHERE floor_id=8 and direction='UL'), 'Lab 12', 'LR');
            INSERT INTO Rooms  (id,segment_id, name, type) VALUES (70,(SELECT id FROM segments WHERE floor_id=8 and direction='UL'), 'Lab 11(AI)', 'LR');
  
            INSERT INTO Rooms  (id,segment_id, name, type) VALUES (71,(SELECT id FROM segments WHERE floor_id=8 and direction='UR'), 'Electro-mechanical System Lab', 'LR');
            INSERT INTO Rooms  (id,segment_id, name, type) VALUES (72,(SELECT id FROM segments WHERE floor_id=8 and direction='UR'), 'Electronics Lab', 'LR');
            INSERT INTO Rooms  (id,segment_id, name, type) VALUES (73,(SELECT id FROM segments WHERE floor_id=8 and direction='UR'), 'Physics Lab', 'LR');
            INSERT INTO Rooms  (id,segment_id, name, type) VALUES (74,(SELECT id FROM segments WHERE floor_id=8 and direction='UR'), 'Male Wash room', 'WR');
  
  
            INSERT INTO Rooms  (id,segment_id, name, type) VALUES (75,(SELECT id FROM segments WHERE floor_id=8 and direction='LL'), 'E35', 'SR');
            INSERT INTO Rooms  (id,segment_id, name, type) VALUES (76,(SELECT id FROM segments WHERE floor_id=8 and direction='LL'), 'E34', 'SR');
            INSERT INTO Rooms  (id,segment_id, name, type) VALUES (77,(SELECT id FROM segments WHERE floor_id=8 and direction='LL'), 'E33', 'SR');
            INSERT INTO Rooms  (id,segment_id, name, type) VALUES (78,(SELECT id FROM segments WHERE floor_id=8 and direction='LL'), 'E32', 'SR');
            INSERT INTO Rooms  (id,segment_id, name, type) VALUES (79,(SELECT id FROM segments WHERE floor_id=8 and direction='LL'), 'E31', 'SR');
  
  
  
            INSERT INTO Rooms  (id,segment_id, name, type) VALUES (80,(SELECT id FROM segments WHERE floor_id=8 and direction='LR'), 'E30', 'SR');
            INSERT INTO Rooms  (id,segment_id, name, type) VALUES (81,(SELECT id FROM segments WHERE floor_id=8 and direction='LR'), 'E29', 'SR');
            INSERT INTO Rooms  (id,segment_id, name, type) VALUES (82,(SELECT id FROM segments WHERE floor_id=8 and direction='LR'), 'BCR', 'BCR');
  
  
            --CS rooms
  
            INSERT INTO Rooms  (id,segment_id, name, type) VALUES (83,(SELECT id FROM segments WHERE floor_id=1 and direction='LL'), 'Faculty Room 1', 'FR');
            INSERT INTO Rooms  (id,segment_id, name, type) VALUES (84,(SELECT id FROM segments WHERE floor_id=1 and direction='LL'), 'Faculty Room 2', 'FR');
  
  
            INSERT INTO Rooms  (id,segment_id, name, type) VALUES (91,(SELECT id FROM segments WHERE floor_id=1 and direction='UL'), 'Room 11', 'FR');
            INSERT INTO Rooms  (id,segment_id, name, type) VALUES (92,(SELECT id FROM segments WHERE floor_id=1 and direction='UL'), 'Room 10', 'FR');
            INSERT INTO Rooms  (id,segment_id, name, type) VALUES (93,(SELECT id FROM segments WHERE floor_id=1 and direction='UL'), 'Room 7', 'FR');
            INSERT INTO Rooms  (id,segment_id, name, type) VALUES (94,(SELECT id FROM segments WHERE floor_id=1 and direction='UL'), 'Room 6', 'FR');
            INSERT INTO Rooms  (id,segment_id, name, type) VALUES (95,(SELECT id FROM segments WHERE floor_id=1 and direction='UL'), 'Room 5', 'FR');
            INSERT INTO Rooms  (id,segment_id, name, type) VALUES (96,(SELECT id FROM segments WHERE floor_id=1 and direction='UL'), 'Room 4', 'FR');
            INSERT INTO Rooms  (id,segment_id, name, type) VALUES (97,(SELECT id FROM segments WHERE floor_id=1 and direction='UL'), 'Room 3', 'FR');
            INSERT INTO Rooms  (id,segment_id, name, type) VALUES (98,(SELECT id FROM segments WHERE floor_id=1 and direction='UL'), 'Room 2', 'FR');
  
            INSERT INTO Rooms  (id,segment_id, name, type) VALUES (99,(SELECT id FROM segments WHERE floor_id=1 and direction='LM'), 'Room 1', 'FR');
            INSERT INTO Rooms  (id,segment_id, name, type) VALUES (100,(SELECT id FROM segments WHERE floor_id=1 and direction='LM'), 'Lab 4 (CS)', 'LR');
            INSERT INTO Rooms  (id,segment_id, name, type) VALUES (101,(SELECT id FROM segments WHERE floor_id=1 and direction='LM'), 'Room 20', 'FR');
            INSERT INTO Rooms  (id,segment_id, name, type) VALUES (102,(SELECT id FROM segments WHERE floor_id=1 and direction='LM'), 'Room 21', 'FR');
            INSERT INTO Rooms  (id,segment_id, name, type) VALUES (103,(SELECT id FROM segments WHERE floor_id=1 and direction='LM'), 'Room 22', 'FR');
            INSERT INTO Rooms  (id,segment_id, name, type) VALUES (104,(SELECT id FROM segments WHERE floor_id=1 and direction='LM'), 'Room 23', 'FR');
  
            INSERT INTO Rooms  (id,segment_id, name, type) VALUES (105,(SELECT id FROM segments WHERE floor_id=0 and direction='RM'), 'HR/Admin Department', 'DEP');
            INSERT INTO Rooms  (id,segment_id, name, type) VALUES (106,(SELECT id FROM segments WHERE floor_id=0 and direction='RM'), 'Faculty Room', 'FR');
  
            INSERT INTO Rooms  (id,segment_id, name, type) VALUES (107,(SELECT id FROM segments WHERE floor_id=0 and direction='UR'), 'Accounts Department', 'DEP');
            INSERT INTO Rooms  (id,segment_id, name, type) VALUES (108,(SELECT id FROM segments WHERE floor_id=0 and direction='UR'), 'Mr Abdul Saeed', 'FR');
            INSERT INTO Rooms  (id,segment_id, name, type) VALUES (109,(SELECT id FROM segments WHERE floor_id=0 and direction='UR'), 'Assistant Manager Admin Office', 'Adm');
  
  
  
  
            INSERT INTO Rooms  (id,segment_id, name, type) VALUES (110,(SELECT id FROM segments WHERE floor_id=2 and direction='UL'), 'Male Wash room', 'WR');
            INSERT INTO Rooms  (id,segment_id, name, type) VALUES (111,(SELECT id FROM segments WHERE floor_id=2 and direction='UL'), 'S2', 'SR');
            INSERT INTO Rooms  (id,segment_id, name, type) VALUES (112,(SELECT id FROM segments WHERE floor_id=2 and direction='UL'), 'Room 17 (HOD office)', 'HEAD');
            INSERT INTO Rooms  (id,segment_id, name, type) VALUES (113,(SELECT id FROM segments WHERE floor_id=2 and direction='UL'), 'Room 15 (Secretariat)', 'Adm');
            INSERT INTO Rooms  (id,segment_id, name, type) VALUES (114,(SELECT id FROM segments WHERE floor_id=2 and direction='UL'), 'Room 14', 'FR');
            INSERT INTO Rooms  (id,segment_id, name, type) VALUES (115,(SELECT id FROM segments WHERE floor_id=2 and direction='UL'), 'R11', 'SR');
  
            INSERT INTO Rooms  (id,segment_id, name, type) VALUES (117,(SELECT id FROM segments WHERE floor_id=2 and direction='UR'), 'HR & QEC Department', 'DEP');
            INSERT INTO Rooms  (id,segment_id, name, type) VALUES (118,(SELECT id FROM segments WHERE floor_id=2 and direction='UR'), 'Room 8 (Manager Administration)', 'Adm');
            INSERT INTO Rooms  (id,segment_id, name, type) VALUES (119,(SELECT id FROM segments WHERE floor_id=2 and direction='UR'), 'Room 6B', 'FR');
            INSERT INTO Rooms  (id,segment_id, name, type) VALUES (120,(SELECT id FROM segments WHERE floor_id=2 and direction='UR'), 'Room 6A', 'FR');
            INSERT INTO Rooms  (id,segment_id, name, type) VALUES (121,(SELECT id FROM segments WHERE floor_id=2 and direction='UR'), 'Room 3 (Director Secretariat)', 'Adm');
            INSERT INTO Rooms  (id,segment_id, name, type) VALUES (122,(SELECT id FROM segments WHERE floor_id=2 and direction='UR'), 'Room 2 (Director)', 'HEAD');
            INSERT INTO Rooms  (id,segment_id, name, type) VALUES (123,(SELECT id FROM segments WHERE floor_id=2 and direction='UR'), 'OneStop', 'Adm');
  
  
            INSERT INTO Rooms  (id,segment_id, name, type) VALUES (124,(SELECT id FROM segments WHERE floor_id=2 and direction='LL'), 'Room 16', 'FR');
  
            INSERT INTO Rooms  (id,segment_id, name, type) VALUES (125,(SELECT id FROM segments WHERE floor_id=2 and direction='LR'), 'LLC', 'SR');
            INSERT INTO Rooms  (id,segment_id, name, type) VALUES (126,(SELECT id FROM segments WHERE floor_id=2 and direction='LR'), 'Room 5 (Conference Room)', 'CR');
            INSERT INTO Rooms  (id,segment_id, name, type) VALUES (127,(SELECT id FROM segments WHERE floor_id=2 and direction='LR'), 'Room 4', 'FR');
  
  
            INSERT INTO Rooms  (id,segment_id, name, type) VALUES (128,(SELECT id FROM segments WHERE floor_id=3 and direction='UL'), 'E4', 'SR');
            INSERT INTO Rooms  (id,segment_id, name, type) VALUES (129,(SELECT id FROM segments WHERE floor_id=3 and direction='UL'), 'E5', 'SR');
            INSERT INTO Rooms  (id,segment_id, name, type) VALUES (130,(SELECT id FROM segments WHERE floor_id=3 and direction='UL'), 'E6', 'SR');
            INSERT INTO Rooms  (id,segment_id, name, type) VALUES (131,(SELECT id FROM segments WHERE floor_id=3 and direction='UL'), 'Male Faculty Wash room', 'WR');
            INSERT INTO Rooms  (id,segment_id, name, type) VALUES (132,(SELECT id FROM segments WHERE floor_id=3 and direction='UL'), 'GCR', 'GCR');
            INSERT INTO Rooms  (id,segment_id, name, type) VALUES (133,(SELECT id FROM segments WHERE floor_id=3 and direction='UL'), 'R109', 'SR');
            INSERT INTO Rooms  (id,segment_id, name, type) VALUES (134,(SELECT id FROM segments WHERE floor_id=3 and direction='UL'), '107a', 'FR');
            INSERT INTO Rooms  (id,segment_id, name, type) VALUES (135,(SELECT id FROM segments WHERE floor_id=3 and direction='UL'), '107b', 'FR');
  
            INSERT INTO Rooms  (id,segment_id, name, type) VALUES (136,(SELECT id FROM segments WHERE floor_id=3 and direction='UR'), 'Lab FYP2', 'LR');
            INSERT INTO Rooms  (id,segment_id, name, type) VALUES (137,(SELECT id FROM segments WHERE floor_id=3 and direction='UR'), 'Lab FYP1', 'LR');
            INSERT INTO Rooms  (id,segment_id, name, type) VALUES (138,(SELECT id FROM segments WHERE floor_id=3 and direction='UR'), 'SysLab (Nvidia Research Center)', 'LR');
            INSERT INTO Rooms  (id,segment_id, name, type) VALUES (139,(SELECT id FROM segments WHERE floor_id=3 and direction='UR'), 'E1', 'SR');
            INSERT INTO Rooms  (id,segment_id, name, type) VALUES (140,(SELECT id FROM segments WHERE floor_id=3 and direction='UR'), 'E2', 'SR');
            INSERT INTO Rooms  (id,segment_id, name, type) VALUES (141,(SELECT id FROM segments WHERE floor_id=3 and direction='UR'), 'E3', 'SR');
  
            INSERT INTO Rooms  (id,segment_id, name, type) VALUES (142,(SELECT id FROM segments WHERE floor_id=3 and direction='LL'), 'Lab 3', 'LR');
            INSERT INTO Rooms  (id,segment_id, name, type) VALUES (143,(SELECT id FROM segments WHERE floor_id=3 and direction='LL'), 'Lab 2 (Networking & CYS Lab)', 'LR');
  
            INSERT INTO Rooms  (id,segment_id, name, type) VALUES (144,(SELECT id FROM segments WHERE floor_id=3 and direction='LR'), 'R106', 'SR');
            INSERT INTO Rooms  (id,segment_id, name, type) VALUES (145,(SELECT id FROM segments WHERE floor_id=3 and direction='LR'), 'Network Operation Center', 'OC');
            INSERT INTO Rooms  (id,segment_id, name, type) VALUES (146,(SELECT id FROM segments WHERE floor_id=3 and direction='LR'), 'Lab 1', 'LR');
  
  
  
  
  
            --Multi-Purpose
  
            INSERT INTO Rooms  (id,segment_id, name, type) VALUES (147,(SELECT id FROM segments WHERE floor_id=9 and direction='M'), 'Library', 'LH');
  
            INSERT INTO Rooms  (id,segment_id, name, type) VALUES (148,(SELECT id FROM segments WHERE floor_id=10 and direction='M'), 'Auditorium', 'AR');
            INSERT INTO Rooms  (id,segment_id, name, type) VALUES (149,(SELECT id FROM segments WHERE floor_id=10 and direction='UR'), 'Conference Room', 'CR');
  
  
            INSERT INTO Rooms  (id,segment_id, name, type) VALUES (150,(SELECT id FROM segments WHERE floor_id=10 and direction='LL'), 'Medical room', 'WR');
            INSERT INTO Rooms  (id,segment_id, name, type) VALUES (151,(SELECT id FROM segments WHERE floor_id=10 and direction='LL'), 'Male Wash room', 'WR');
            INSERT INTO Rooms  (id,segment_id, name, type) VALUES (152,(SELECT id FROM segments WHERE floor_id=10 and direction='LL'), 'Female Wash room', 'WR');
  
  
            INSERT INTO Rooms  (id,segment_id, name, type) VALUES (153,(SELECT id FROM segments WHERE floor_id=11 and direction='M'), 'Cafeteria', 'Cafe');
            INSERT INTO Rooms  (id,segment_id, name, type) VALUES (154,(SELECT id FROM segments WHERE floor_id=11 and direction='LL'), 'Male Wash room', 'WR');
            INSERT INTO Rooms  (id,segment_id, name, type) VALUES (155,(SELECT id FROM segments WHERE floor_id=11 and direction='LL'), 'Female Wash room', 'WR');
  
  
            INSERT INTO Rooms  (id,segment_id, name, type) VALUES (156,(SELECT id FROM segments WHERE floor_id=6 and direction='M'), 'Faculty Office', 'FR');
  
            INSERT INTO Rooms (id, segment_id, name, type) VALUES (157, (SELECT id FROM segments WHERE floor_id=0 and direction='RM'), 'Procurement Department','DEP');
  
  
            INSERT INTO Rooms  (id,segment_id, name, type) VALUES (158,(SELECT id FROM segments WHERE floor_id=2 and direction='LL'), 'Room 13 (Professor & Dean of Computing)', 'HEAD');
            INSERT INTO Rooms  (id,segment_id, name, type) VALUES (159,(SELECT id FROM segments WHERE floor_id=2 and direction='LL'), 'R12', 'SR');
  
  
  
            --faculty
            --A faculty
            INSERT INTO FACULTY (name, room_id) VALUES ('Ms Huma Hafeez', 6);
            INSERT INTO FACULTY (name, room_id) VALUES ('Ms Urooj', 6);
            INSERT INTO FACULTY (name, room_id) VALUES ('Ms Shahmeen Ismail', 6);
  
  
            --B faculty 
            INSERT INTO FACULTY (name, room_id) VALUES ('Ms Huma Dawood', 34);
            INSERT INTO FACULTY (name, room_id) VALUES ('Mr Ahsan Ali Abbasi', 34);
            INSERT INTO FACULTY (name, room_id) VALUES ('Mr Jahangir Tanveer', 34);
            INSERT INTO FACULTY (name, room_id) VALUES ('Ms Zehra Mukhtiar', 34);
            INSERT INTO FACULTY (name, room_id) VALUES ('Mr Michael Simon', 34);
            INSERT INTO FACULTY (name, room_id) VALUES ('Mr Muhammad Ahsan', 34);
            INSERT INTO FACULTY (name, room_id) VALUES ('Ms Asiya Zaheer', 34);
            INSERT INTO FACULTY (name, room_id) VALUES ('Mr Muhammad Yousuf', 34);
  
  
            INSERT INTO FACULTY (name, room_id) VALUES ('Dr Muhammad Adeel', 24);
            INSERT INTO FACULTY (name, room_id) VALUES ('Dr Sarfaraz Bhutto', 24);
            INSERT INTO FACULTY (name, room_id) VALUES ('Dr Nazia Nazeer', 24);
            INSERT INTO FACULTY (name, room_id) VALUES ('Ms Ayesha Khan', 24);
            INSERT INTO FACULTY (name, room_id) VALUES ('Dr Mushtaq Ahmed', 24);
            INSERT INTO FACULTY (name, room_id) VALUES ('Dr Muhammad Saad', 24);
  
  
            INSERT INTO FACULTY (name, room_id) VALUES ('Mr Syed Bilal Ahsan', 23);
            INSERT INTO FACULTY (name, room_id) VALUES ('Mr Omer Qureshi', 23);
            INSERT INTO FACULTY (name, room_id) VALUES ('Mr Farooq Zaidi', 23);
            INSERT INTO FACULTY (name, room_id) VALUES ('Dr Kamran Ali', 23);
            INSERT INTO FACULTY (name, room_id) VALUES ('Ms Rafia Sheikh', 23);
            INSERT INTO FACULTY (name, room_id) VALUES ('Dr Muhammad Farrukh Shahid', 23);
            INSERT INTO FACULTY (name, room_id) VALUES ('Ms Alishba Subhani', 23);
            INSERT INTO FACULTY (name, room_id) VALUES ('Ms Sania Urooj', 23);
            INSERT INTO FACULTY (name, room_id) VALUES ('Dr Muhammad Rafi', 23);
            INSERT INTO FACULTY (name, room_id) VALUES ('Dr Maria Siddiqua', 23);
  
  
            INSERT INTO FACULTY (name, room_id) VALUES ('Ms Alishba Tariq', 21);
            INSERT INTO FACULTY (name, room_id) VALUES ('Ms Amna Ali', 21);
            INSERT INTO FACULTY (name, room_id) VALUES ('Dr Nazish Kanwal', 21);
            INSERT INTO FACULTY (name, room_id) VALUES ('Mr Muhammad Farhan Ali Memon', 21);
            INSERT INTO FACULTY (name, room_id) VALUES ('Mr Muhammad Rahim', 21);
            INSERT INTO FACULTY (name, room_id) VALUES ('Dr Shahnawaz Khan', 21);
            INSERT INTO FACULTY (name, room_id) VALUES ('Dr Muhammad Shahzad Shaikh', 21);
            INSERT INTO FACULTY (name, room_id) VALUES ('Ms Aqsa Fayyaz', 21);
            INSERT INTO FACULTY (name, room_id) VALUES ('Mr Moheez Ur Rahim', 21);
            INSERT INTO FACULTY (name, room_id) VALUES ('Mr Mairaj', 21);
  
  
            INSERT INTO FACULTY (name, room_id) VALUES ('Mr M.Jamil Usmani', 28);
            INSERT INTO FACULTY (name, room_id) VALUES ('Engr Qurat ul Ain Sohail', 28);
            INSERT INTO FACULTY (name, room_id) VALUES ('Dr M.Junnaid Rabbani', 28);
            INSERT INTO FACULTY (name, room_id) VALUES ('Dr Syed M.Atif Saleem', 28);
            INSERT INTO FACULTY (name, room_id) VALUES ('Engr Haris Mohsin', 28);
            INSERT INTO FACULTY (name, room_id) VALUES ('Engr Zakir Hussain', 28);
            INSERT INTO FACULTY (name, room_id) VALUES ('Engr Syed Areeb Ahmed', 28);
            INSERT INTO FACULTY (name, room_id) VALUES ('Engr Aamir Ali', 28);
            INSERT INTO FACULTY (name, room_id) VALUES ('Engr Rukhsar Ali', 28);
            INSERT INTO FACULTY (name, room_id) VALUES ('Mr Kashif Ahmed', 28);
            INSERT INTO FACULTY (name, room_id) VALUES ('Engr M.Misbah Haider Malik', 28);
            INSERT INTO FACULTY (name, room_id) VALUES ('Engr Usama Bin Umr', 28);
            INSERT INTO FACULTY (name, room_id) VALUES ('Engr Muhammad Adnan', 28);
            INSERT INTO FACULTY (name, room_id) VALUES ('Engr M.Ahsan Khan', 28);
            INSERT INTO FACULTY (name, room_id) VALUES ('Dr Haider Mehdi', 28);
            INSERT INTO FACULTY (name, room_id) VALUES ('Engr Aqib Noor', 28);
            INSERT INTO FACULTY (name, room_id) VALUES ('Engr Sadaf Ayesha', 28);
            INSERT INTO FACULTY (name, room_id) VALUES ('Engr Maham Ghauri', 28);
  
  
  
            --C faulty
            INSERT INTO FACULTY (name, room_id) VALUES ('Ms Kausar Malik', 50);
            INSERT INTO FACULTY (name, room_id) VALUES ('Ms Wajiha Durrani', 50);
            INSERT INTO FACULTY (name, room_id) VALUES ('Ms Javeriya Hussain', 50);
            INSERT INTO FACULTY (name, room_id) VALUES ('Mr Muhammad Amjad', 50);
            INSERT INTO FACULTY (name, room_id) VALUES ('Dr Khusro Mian', 50);
            INSERT INTO FACULTY (name, room_id) VALUES ('Ms Faiza Mumtaz', 50);
            INSERT INTO FACULTY (name, room_id) VALUES ('Ms Fareeha Sultan', 50);
            INSERT INTO FACULTY (name, room_id) VALUES ('Ms Nazia Imam', 50);
            INSERT INTO FACULTY (name, room_id) VALUES ('Ms Rabia Tabassum', 50);
            INSERT INTO FACULTY (name, room_id) VALUES ('Ms Asma Masood', 50);
  
  
            INSERT INTO FACULTY (name, room_id) VALUES ('Mr Muhammad Hasham', 156);
            INSERT INTO FACULTY (name, room_id) VALUES ('Mr Ihstiaq Ahmed', 156);
            INSERT INTO FACULTY (name, room_id) VALUES ('Ms Mariam Aftab', 156);
            INSERT INTO FACULTY (name, room_id) VALUES ('Ms Uzma Saleh', 156);
            INSERT INTO FACULTY (name, room_id) VALUES ('Mr Usama Antuley', 156);
            INSERT INTO FACULTY (name, room_id) VALUES ('Dr Muhammad Hassan Saeed', 156);
            INSERT INTO FACULTY (name, room_id) VALUES ('Mr M.Abdul Basit Khan', 156);
            INSERT INTO FACULTY (name, room_id) VALUES ('Mr Muhammad Shahid Ashraf', 156);
            INSERT INTO FACULTY (name, room_id) VALUES ('Mr Nadeem Khan', 156);
            INSERT INTO FACULTY (name, room_id) VALUES ('Ms Rabia Ijaz', 156);
  
            --CS faculty
            INSERT INTO FACULTY (name, room_id) VALUES ('Ms Atiya Jokhio',83);
            INSERT INTO FACULTY (name, room_id) VALUES ('Mr Muh Minhal Raza',83);
            INSERT INTO FACULTY (name, room_id) VALUES ('Mr Basit Ali',83);
            INSERT INTO FACULTY (name, room_id) VALUES ('Mr Syed Zain Ul Hasan',83);
  
  
            INSERT INTO FACULTY (name, room_id) VALUES ('Ms Iqra Fahad', 84);
            INSERT INTO FACULTY (name, room_id) VALUES ('Ms Bakhtawar Abbasi', 84);
            INSERT INTO FACULTY (name, room_id) VALUES ('Ms Nida Munawar', 84);
            INSERT INTO FACULTY (name, room_id) VALUES ('Ms Sobia Iftikhar', 84);
  
            INSERT INTO FACULTY (name, room_id) VALUES ('Mr Faisal Ali Syed', 92);
            INSERT INTO FACULTY (name, room_id) VALUES ('Mr Nauraiz Subhan', 92);
  
  
            INSERT INTO FACULTY (name, room_id) VALUES ('Dr Abdul Aziz', 93);
            INSERT INTO FACULTY (name, room_id) VALUES ('Dr Nadeem Kafi', 93);
  
            INSERT INTO FACULTY (name, room_id) VALUES ('Dr Imran Ali Bhatti', 94);
  
            INSERT INTO FACULTY (name, room_id) VALUES ('Ms Hira Tunio', 95);
            INSERT INTO FACULTY (name, room_id) VALUES ('Ms Zain Noreen', 95);
  
            INSERT INTO FACULTY (name, room_id) VALUES ('Ms Alina Arshad', 96);
            INSERT INTO FACULTY (name, room_id) VALUES ('Ms Syeda Ravia Ejaz', 96);
            INSERT INTO FACULTY (name, room_id) VALUES ('Ms Filza Akhkaq', 96);
  
  
            INSERT INTO FACULTY (name, room_id) VALUES ('Dr Muhammad Nouman Durrani', 97);
  
            INSERT INTO FACULTY (name, room_id) VALUES ('Dr Anam Qureshi', 98);
  
  
            INSERT INTO FACULTY (name, room_id) VALUES ('Dr Farrukh Hasan Syed', 99);
  
            INSERT INTO FACULTY (name, room_id) VALUES ('Mr Shaheer Ahmed', 101);
            INSERT INTO FACULTY (name, room_id) VALUES ('Mr Norman Hanif', 101);
  
  
  
            INSERT INTO FACULTY (name, room_id) VALUES ('Mr Sameer Faisal', 102);
            INSERT INTO FACULTY (name, room_id) VALUES ('Mr Sohail Ahmed', 102);
  
  
  
            INSERT INTO FACULTY (name, room_id) VALUES ('Mr Muhammad Nadeem Ghouri', 103);
            INSERT INTO FACULTY (name, room_id) VALUES ('Mr Muhammad Monis', 103);
  
  
  
            INSERT INTO FACULTY (name, room_id) VALUES ('Mr Ubaidullah', 104);
            INSERT INTO FACULTY (name, room_id) VALUES ('Mr Yasir Arfat', 104);
            INSERT INTO FACULTY (name, room_id) VALUES ('Mr Shafique Ur Rehman', 104);
  
  
  
            INSERT INTO FACULTY (name, room_id) VALUES ('Mr Adil Sheraz', 106);
            INSERT INTO FACULTY (name, room_id) VALUES ('Mr Muhammad Kashif', 106);
            INSERT INTO FACULTY (name, room_id) VALUES ('Mr Shoaib Raza', 106);
            INSERT INTO FACULTY (name, room_id) VALUES ('Engr Abdul Rahman', 106);
            INSERT INTO FACULTY (name, room_id) VALUES ('Mr Fahad Hussain', 106);
            INSERT INTO FACULTY (name, room_id) VALUES ('Mr Muhammad Usman', 106);
            INSERT INTO FACULTY (name, room_id) VALUES ('Ms Fizza Aqeel', 106);
            INSERT INTO FACULTY (name, room_id) VALUES ('Ms Ayesha Ali', 106);
  
  
  
            INSERT INTO FACULTY (name, room_id) VALUES ('Dr Aqsa Aslam', 114);
            INSERT INTO FACULTY (name, room_id) VALUES ('Ms Shaharbano', 114);
            INSERT INTO FACULTY (name, room_id) VALUES ('Ms Zainab Asif Javed', 114);
            INSERT INTO FACULTY (name, room_id) VALUES ('Ms Bushra Sattar', 114);
  
  
            INSERT INTO FACULTY (name, room_id) VALUES ('Ms Rubab Manzar', 119);
            INSERT INTO FACULTY (name, room_id) VALUES ('Ms Javeria Farooq', 119);
  
  
            INSERT INTO FACULTY (name, room_id) VALUES ('Dr Ghufran Ahmed', 120);
            INSERT INTO FACULTY (name, room_id) VALUES ('Ms Madiha Rehman',120);
            INSERT INTO FACULTY (name, room_id) VALUES ('Ms Ramsha Iqbal', 120);
            INSERT INTO FACULTY (name, room_id) VALUES ('Ms Rabia Ahmed',120);
            INSERT INTO FACULTY (name, room_id) VALUES ('Ms Abeer Gauher', 120);
  
  
            INSERT INTO FACULTY (name, room_id) VALUES ('Ms Abeeha Sattar',124);
            INSERT INTO FACULTY (name, room_id) VALUES ('Mr Aashir Mehboob', 124);
            INSERT INTO FACULTY (name, room_id) VALUES ('Mr Kashan Naqvi', 124);
            INSERT INTO FACULTY (name, room_id) VALUES ('Ms Sumaiyah Zahid', 124);
            INSERT INTO FACULTY (name, room_id) VALUES ('Dr Muazzam Ali Shah', 124);
            INSERT INTO FACULTY (name, room_id) VALUES ('Mr Shoaib Rauf', 124);
            INSERT INTO FACULTY (name, room_id) VALUES ('Ms Safia', 124);
            INSERT INTO FACULTY (name, room_id) VALUES ('Dr Fahad Sherwani', 124);
            INSERT INTO FACULTY (name, room_id) VALUES ('Ms Mubashra Fayyaz', 124);
            INSERT INTO FACULTY (name, room_id) VALUES ('Ms Yusra Kaleem', 124);
  
  
            INSERT INTO FACULTY (name, room_id) VALUES ('Ms Atifa Batool', 127);
            INSERT INTO FACULTY (name, room_id) VALUES ('Ms Javeria Ali Wadho', 127);
            INSERT INTO FACULTY (name, room_id) VALUES ('Ms Khadija Shereen', 127);
            INSERT INTO FACULTY (name, room_id) VALUES ('Ms Anaum Hamid', 127);
  
  
            INSERT INTO FACULTY (name, room_id) VALUES ('Mr Talha Shahid', 134);
            INSERT INTO FACULTY (name, room_id) VALUES ('Mr Muhammad Khalid', 134);
            INSERT INTO FACULTY (name, room_id) VALUES ('Mr Muhammad Aashir', 134);
            INSERT INTO FACULTY (name, room_id) VALUES ('Mr Waseem Rauf', 134);
            INSERT INTO FACULTY (name, room_id) VALUES ('Mr Mubashir', 134);
            INSERT INTO FACULTY (name, room_id) VALUES ('Mr Ghulam Qadir Bhurgari', 134);

  
            INSERT INTO FACULTY (name, room_id) VALUES ('Ms Mehak Mazhar', 135);
            INSERT INTO FACULTY (name, room_id) VALUES ('Ms Mahnoor Javed', 135);
            INSERT INTO FACULTY (name, room_id) VALUES ('Ms Fatima Gado', 135);
            INSERT INTO FACULTY (name, room_id) VALUES ('Ms Khadija Tul Kubra', 135);
            INSERT INTO FACULTY (name, room_id) VALUES ('Ms Yumna Asif', 135);
            INSERT INTO FACULTY (name, room_id) VALUES ('Ms Syeda Tehreem Gilani', 135);
  
  
            --CS CYS
            INSERT INTO FACULTY (name, room_id) VALUES ('Dr Shahbaz Siddiqui', 29);
            INSERT INTO FACULTY (name, room_id) VALUES ('Mr Abuzar Zafar', 29);
            INSERT INTO FACULTY (name, room_id) VALUES ('Mr M.Kariz Kamal', 29);
            INSERT INTO FACULTY (name, room_id) VALUES ('Mr Muhammad Ali Naseer', 29);
            INSERT INTO FACULTY (name, room_id) VALUES ('Dr Sufian Hameed', 29);
            INSERT INTO FACULTY (name, room_id) VALUES ('Mr Muhammad Nauman', 29);
            INSERT INTO FACULTY (name, room_id) VALUES ('Mr Sandesh Kumar', 29);
            INSERT INTO FACULTY (name, room_id) VALUES ('Dr Fahad Samad', 29);          
  
            --INSERTING HEADS AS FACULTY
            INSERT INTO FACULTY (name, room_id) VALUES ('Dr Burhan Khan', 22);
            INSERT INTO FACULTY (name, room_id) VALUES ('Dr. Atif Tahir', 112);
            INSERT INTO FACULTY (name, room_id) VALUES ('Dr. Zulfiqar Ali Memon', 122);
            INSERT INTO FACULTY (name, room_id) VALUES ('Dr. Jawwad A. Shamsi', 158);
            
          END IF;
      END $$;
  
      COMMIT;
    `);    
  }
  catch(error){
    await query('ROLLBACK');
    throw error;
  }


}

module.exports = {
  dbSetup,
  query
};