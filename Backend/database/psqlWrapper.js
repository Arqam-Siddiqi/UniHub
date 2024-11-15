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
        name VARCHAR(64) NOT NULL,  -- e.g., 'C-19', 'B-9'
        type VARCHAR(3) NOT NULL REFERENCES Room_Types(code) ON DELETE RESTRICT
      );

      CREATE TABLE IF NOT EXISTS Likes (
        user_id UUID REFERENCES Users(id) ON DELETE CASCADE,
        repo_id UUID REFERENCES Repos(id) ON DELETE CASCADE,
        PRIMARY KEY (user_id, repo_id)
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

  await pool.query(`

    DO $$
    BEGIN
        IF NOT EXISTS (SELECT 1 FROM buildings) THEN
            
          INSERT INTO buildings (id,name) VALUES (1,'Computer Science');
          INSERT INTO buildings (id,name) VALUES (2,'Electrical Engineering');
          INSERT INTO buildings (id,name) VALUES (3,'Multi-purpose');

          --select * from buildings;


          INSERT INTO Floors (id,building_id,name,level) VALUES (1,1, 'Basement' , 0);
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
          INSERT INTO segments (id,floor_id, direction) VALUES (1,(SELECT id FROM Floors WHERE level=0 and building_id=(SELECT id FROM buildings WHERE name='Computer Science')), 'UR');
          INSERT INTO segments (id,floor_id, direction) VALUES (2,(SELECT id FROM Floors WHERE level=0 and building_id=(SELECT id FROM buildings WHERE name='Computer Science')), 'UL');
          INSERT INTO segments (id,floor_id, direction) VALUES (3,(SELECT id FROM Floors WHERE level=0 and building_id=(SELECT id FROM buildings WHERE name='Computer Science')), 'LR');
          INSERT INTO segments (id,floor_id, direction) VALUES (4,(SELECT id FROM Floors WHERE level=0 and building_id=(SELECT id FROM buildings WHERE name='Computer Science')), 'LL');

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
          INSERT INTO room_types (code, name) VALUES ('HO','HOD office');
          INSERT INTO room_types (code, name) VALUES ('GR','Guest Room');
          INSERT INTO room_types (code, name) VALUES ('ER','Empty Room');
          INSERT INTO room_types (code, name) VALUES ('LH','Library Hall');
          INSERT INTO room_types (code, name) VALUES ('OC','Operation center');



          --select * from room_types;


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


          INSERT INTO Rooms  (id,segment_id, name, type) VALUES (19,(SELECT id FROM segments WHERE floor_id=5 and direction='UL'), 'Male faculty wash room', 'WR');
          INSERT INTO Rooms  (id,segment_id, name, type) VALUES (20,(SELECT id FROM segments WHERE floor_id=5 and direction='UL'), 'Female prayer area', 'PR');
          INSERT INTO Rooms  (id,segment_id, name, type) VALUES (21,(SELECT id FROM segments WHERE floor_id=5 and direction='UL'), 'Faculty office(S & H)', 'FR');
          INSERT INTO Rooms  (id,segment_id, name, type) VALUES (22,(SELECT id FROM segments WHERE floor_id=5 and direction='UL'), 'HOD office', 'HO');


          INSERT INTO Rooms  (id,segment_id, name, type) VALUES (23,(SELECT id FROM segments WHERE floor_id=5 and direction='UR'), 'Faculty office(AI & DS)', 'FR');
          INSERT INTO Rooms  (id,segment_id, name, type) VALUES (24,(SELECT id FROM segments WHERE floor_id=5 and direction='UR'), 'Faculty office(SOM 2)', 'FR');
          INSERT INTO Rooms  (id,segment_id, name, type) VALUES (25,(SELECT id FROM segments WHERE floor_id=5 and direction='UR'), 'Guest room 1', 'GR');
          INSERT INTO Rooms  (id,segment_id, name, type) VALUES (26,(SELECT id FROM segments WHERE floor_id=5 and direction='UR'), 'Guest room 2', 'GR');
          INSERT INTO Rooms  (id,segment_id, name, type) VALUES (27,(SELECT id FROM segments WHERE floor_id=5 and direction='UR'), 'Male faculty wash room', 'WR');


          INSERT INTO Rooms  (id,segment_id, name, type) VALUES (28,(SELECT id FROM segments WHERE floor_id=5 and direction='LL'), 'Faculty office', 'FR');
          INSERT INTO Rooms  (id,segment_id, name, type) VALUES (29,(SELECT id FROM segments WHERE floor_id=5 and direction='LL'), 'Faculty office(CYS)', 'FR');


          INSERT INTO Rooms  (id,segment_id, name, type) VALUES (30,(SELECT id FROM segments WHERE floor_id=5 and direction='LR'), 'Conference room', 'CR');
          INSERT INTO Rooms  (id,segment_id, name, type) VALUES (31,(SELECT id FROM segments WHERE floor_id=5 and direction='LR'), 'B9', 'SR');
          INSERT INTO Rooms  (id,segment_id, name, type) VALUES (32,(SELECT id FROM segments WHERE floor_id=5 and direction='LR'), 'B10', 'SR');
          INSERT INTO Rooms  (id,segment_id, name, type) VALUES (33,(SELECT id FROM segments WHERE floor_id=5 and direction='LR'), 'B11', 'SR');
          INSERT INTO Rooms  (id,segment_id, name, type) VALUES (34,(SELECT id FROM segments WHERE floor_id=5 and direction='LR'), 'Faculty office(SOM 1)', 'FR');




          INSERT INTO Rooms  (id,segment_id, name, type) VALUES (35,(SELECT id FROM segments WHERE floor_id=6 and direction='UL'), 'Male wash room', 'WR');
          INSERT INTO Rooms  (id,segment_id, name, type) VALUES (36,(SELECT id FROM segments WHERE floor_id=6 and direction='UL'), 'Empty room(for events)', 'ER');
          INSERT INTO Rooms  (id,segment_id, name, type) VALUES (37,(SELECT id FROM segments WHERE floor_id=6 and direction='UL'), 'C20', 'SR');
          INSERT INTO Rooms  (id,segment_id, name, type) VALUES (38,(SELECT id FROM segments WHERE floor_id=6 and direction='UL'), 'C21', 'SR');

          INSERT INTO Rooms  (id,segment_id, name, type) VALUES (39,(SELECT id FROM segments WHERE floor_id=6 and direction='UR'), 'C16', 'SR');
          INSERT INTO Rooms  (id,segment_id, name, type) VALUES (40,(SELECT id FROM segments WHERE floor_id=6 and direction='UR'), 'C15', 'SR');
          INSERT INTO Rooms  (id,segment_id, name, type) VALUES (41,(SELECT id FROM segments WHERE floor_id=6 and direction='UR'), 'Project Lab', 'LR');
          INSERT INTO Rooms  (id,segment_id, name, type) VALUES (42,(SELECT id FROM segments WHERE floor_id=6 and direction='UR'), 'Female faculty wash room', 'WR');

          INSERT INTO Rooms  (id,segment_id, name, type) VALUES (43,(SELECT id FROM segments WHERE floor_id=6 and direction='LL'), 'Lab 7', 'LR');
          INSERT INTO Rooms  (id,segment_id, name, type) VALUES (44,(SELECT id FROM segments WHERE floor_id=6 and direction='LL'), 'C19', 'SR');
          INSERT INTO Rooms  (id,segment_id, name, type) VALUES (45,(SELECT id FROM segments WHERE floor_id=6 and direction='LL'), 'C18', 'SR');
          INSERT INTO Rooms  (id,segment_id, name, type) VALUES (46,(SELECT id FROM segments WHERE floor_id=6 and direction='LL'), 'C17', 'SR');


          INSERT INTO Rooms  (id,segment_id, name, type) VALUES (47,(SELECT id FROM segments WHERE floor_id=6 and direction='LR'), 'C14', 'SR');
          INSERT INTO Rooms  (id,segment_id, name, type) VALUES (48,(SELECT id FROM segments WHERE floor_id=6 and direction='LR'), 'C13', 'SR');
          INSERT INTO Rooms  (id,segment_id, name, type) VALUES (49,(SELECT id FROM segments WHERE floor_id=6 and direction='LR'), 'C12', 'SR');
          INSERT INTO Rooms  (id,segment_id, name, type) VALUES (50,(SELECT id FROM segments WHERE floor_id=6 and direction='LR'), 'Faculty office', 'FR');


          INSERT INTO Rooms  (id,segment_id, name, type) VALUES (51,(SELECT id FROM segments WHERE floor_id=7 and direction='UL'), 'Female wash room', 'WR');
          INSERT INTO Rooms  (id,segment_id, name, type) VALUES (52,(SELECT id FROM segments WHERE floor_id=7 and direction='UL'), 'Library reading hall', 'LH');
          INSERT INTO Rooms  (id,segment_id, name, type) VALUES (53,(SELECT id FROM segments WHERE floor_id=7 and direction='UL'), 'Lab 10', 'LR');


          INSERT INTO Rooms  (id,segment_id, name, type) VALUES (54,(SELECT id FROM segments WHERE floor_id=7 and direction='UR'), 'Lab 8(networking & CYS lab)', 'LR');
          INSERT INTO Rooms  (id,segment_id, name, type) VALUES (55,(SELECT id FROM segments WHERE floor_id=7 and direction='UR'), 'Security lab', 'LR');
          INSERT INTO Rooms  (id,segment_id, name, type) VALUES (56,(SELECT id FROM segments WHERE floor_id=7 and direction='UR'), 'Lab 9', 'LR');
          INSERT INTO Rooms  (id,segment_id, name, type) VALUES (57,(SELECT id FROM segments WHERE floor_id=7 and direction='UR'), 'Network operation center', 'OC');
          INSERT INTO Rooms  (id,segment_id, name, type) VALUES (58,(SELECT id FROM segments WHERE floor_id=7 and direction='UR'), 'Female wash room', 'WR');

          INSERT INTO Rooms  (id,segment_id, name, type) VALUES (59,(SELECT id FROM segments WHERE floor_id=7 and direction='LL'), 'D28', 'SR');
          INSERT INTO Rooms  (id,segment_id, name, type) VALUES (60,(SELECT id FROM segments WHERE floor_id=7 and direction='LL'), 'D27', 'SR');
          INSERT INTO Rooms  (id,segment_id, name, type) VALUES (61,(SELECT id FROM segments WHERE floor_id=7 and direction='LL'), 'D26', 'SR');
          INSERT INTO Rooms  (id,segment_id, name, type) VALUES (62,(SELECT id FROM segments WHERE floor_id=7 and direction='LL'), 'D25', 'SR');
          INSERT INTO Rooms  (id,segment_id, name, type) VALUES (63,(SELECT id FROM segments WHERE floor_id=7 and direction='LL'), 'D24', 'SR');

          INSERT INTO Rooms  (id,segment_id, name, type) VALUES (64,(SELECT id FROM segments WHERE floor_id=7 and direction='LR'), 'D23', 'SR');
          INSERT INTO Rooms  (id,segment_id, name, type) VALUES (65,(SELECT id FROM segments WHERE floor_id=7 and direction='LR'), 'D22', 'SR');

          INSERT INTO Rooms  (id,segment_id, name, type) VALUES (67,(SELECT id FROM segments WHERE floor_id=8 and direction='UL'), 'Male wash room', 'WR');
          INSERT INTO Rooms  (id,segment_id, name, type) VALUES (68,(SELECT id FROM segments WHERE floor_id=8 and direction='UL'), 'Empty room', 'ER');
          INSERT INTO Rooms  (id,segment_id, name, type) VALUES (69,(SELECT id FROM segments WHERE floor_id=8 and direction='UL'), 'Lab 12', 'LR');
          INSERT INTO Rooms  (id,segment_id, name, type) VALUES (70,(SELECT id FROM segments WHERE floor_id=8 and direction='UL'), 'Lab 11(AI)', 'LR');

          INSERT INTO Rooms  (id,segment_id, name, type) VALUES (71,(SELECT id FROM segments WHERE floor_id=8 and direction='UR'), 'Electro-mechanical system lab', 'LR');
          INSERT INTO Rooms  (id,segment_id, name, type) VALUES (72,(SELECT id FROM segments WHERE floor_id=8 and direction='UR'), 'Electronics lab', 'LR');
          INSERT INTO Rooms  (id,segment_id, name, type) VALUES (73,(SELECT id FROM segments WHERE floor_id=8 and direction='UR'), 'Physics lab', 'LR');
          INSERT INTO Rooms  (id,segment_id, name, type) VALUES (74,(SELECT id FROM segments WHERE floor_id=8 and direction='UR'), 'Male wash room', 'WR');


          INSERT INTO Rooms  (id,segment_id, name, type) VALUES (75,(SELECT id FROM segments WHERE floor_id=8 and direction='LL'), 'E35', 'SR');
          INSERT INTO Rooms  (id,segment_id, name, type) VALUES (76,(SELECT id FROM segments WHERE floor_id=8 and direction='LL'), 'E34', 'SR');
          INSERT INTO Rooms  (id,segment_id, name, type) VALUES (77,(SELECT id FROM segments WHERE floor_id=8 and direction='LL'), 'E33', 'SR');
          INSERT INTO Rooms  (id,segment_id, name, type) VALUES (78,(SELECT id FROM segments WHERE floor_id=8 and direction='LL'), 'E32', 'SR');
          INSERT INTO Rooms  (id,segment_id, name, type) VALUES (79,(SELECT id FROM segments WHERE floor_id=8 and direction='LL'), 'E31', 'SR');



          INSERT INTO Rooms  (id,segment_id, name, type) VALUES (80,(SELECT id FROM segments WHERE floor_id=8 and direction='LR'), 'E30', 'SR');
          INSERT INTO Rooms  (id,segment_id, name, type) VALUES (81,(SELECT id FROM segments WHERE floor_id=8 and direction='LR'), 'E29', 'SR');
          INSERT INTO Rooms  (id,segment_id, name, type) VALUES (82,(SELECT id FROM segments WHERE floor_id=8 and direction='LR'), 'BCR', 'BCR');


        END IF;
    END $$;

  `);

}

module.exports = {
  dbSetup,
  query
};