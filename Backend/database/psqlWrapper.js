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

  await pool.query(`

    DO $$
    BEGIN
        IF NOT EXISTS (SELECT 1 FROM buildings) THEN
          
          INSERT INTO buildings (id,name) VALUES (1,'Computer Science');
          INSERT INTO buildings (id,name) VALUES (2,'Electrical Engineering');
          INSERT INTO buildings (id,name) VALUES (3,'Multi-purpose');


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

          INSERT INTO segments (id,floor_id, direction) VALUES (46,(SELECT id FROM Floors WHERE level=0 and building_id=(SELECT id FROM buildings WHERE name='Computer Science')), 'LM');
          INSERT INTO segments (id,floor_id, direction) VALUES (47,(SELECT id FROM Floors WHERE level=0 and building_id=(SELECT id FROM buildings WHERE name='Computer Science')), 'RM');

          INSERT INTO segments (id,floor_id, direction) VALUES (48,(SELECT id FROM Floors WHERE level=0 and building_id=(SELECT id FROM buildings WHERE name='Multi-purpose')), 'M');
          INSERT INTO segments (id,floor_id, direction) VALUES (49,(SELECT id FROM Floors WHERE level=1 and building_id=(SELECT id FROM buildings WHERE name='Multi-purpose')), 'M');
          INSERT INTO segments (id,floor_id, direction) VALUES (50,(SELECT id FROM Floors WHERE level=2 and building_id=(SELECT id FROM buildings WHERE name='Multi-purpose')), 'M');
          INSERT INTO segments (id,floor_id, direction) VALUES (51,(SELECT id FROM Floors WHERE level=3 and building_id=(SELECT id FROM buildings WHERE name='Electrical Engineering')), 'M');



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
          INSERT INTO room_types (code, name) VALUES ('DEP','Department');
          INSERT INTO room_types (code, name) VALUES ('DIR','Director');


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
          INSERT INTO Rooms  (id,segment_id, name, type) VALUES (66,(SELECT id FROM segments WHERE floor_id=7 and direction='LR'), 'GCR', 'GCR');

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


          --CS rooms
          INSERT INTO Rooms  (id,segment_id, name, type) VALUES (83,(SELECT id FROM segments WHERE floor_id=1 and direction='LL'), 'Ms Atiya Jokhio', 'FR');
          INSERT INTO Rooms  (id,segment_id, name, type) VALUES (84,(SELECT id FROM segments WHERE floor_id=1 and direction='LL'), 'Mr Muh Minhal Raza', 'FR');
          INSERT INTO Rooms  (id,segment_id, name, type) VALUES (85,(SELECT id FROM segments WHERE floor_id=1 and direction='LL'), 'Mr Basit Ali', 'FR');
          INSERT INTO Rooms  (id,segment_id, name, type) VALUES (86,(SELECT id FROM segments WHERE floor_id=1 and direction='LL'), 'Mr Syed Zain Ul Hasan', 'FR');
          INSERT INTO Rooms  (id,segment_id, name, type) VALUES (87,(SELECT id FROM segments WHERE floor_id=1 and direction='LL'), 'Ms Iqra Fahad', 'FR');
          INSERT INTO Rooms  (id,segment_id, name, type) VALUES (88,(SELECT id FROM segments WHERE floor_id=1 and direction='LL'), 'Ms Bakhtawar Abbasi', 'FR');
          INSERT INTO Rooms  (id,segment_id, name, type) VALUES (89,(SELECT id FROM segments WHERE floor_id=1 and direction='LL'), 'Ms Nida Munawar', 'FR');
          INSERT INTO Rooms  (id,segment_id, name, type) VALUES (90,(SELECT id FROM segments WHERE floor_id=1 and direction='LL'), 'Ms Sobia Iftikhar', 'FR');
          INSERT INTO Rooms  (id,segment_id, name, type) VALUES (91,(SELECT id FROM segments WHERE floor_id=1 and direction='UL'), 'Room 11', 'FR');
          INSERT INTO Rooms  (id,segment_id, name, type) VALUES (92,(SELECT id FROM segments WHERE floor_id=1 and direction='UL'), 'Room 10', 'FR');
          INSERT INTO Rooms  (id,segment_id, name, type) VALUES (93,(SELECT id FROM segments WHERE floor_id=1 and direction='UL'), 'Room 7', 'FR');
          INSERT INTO Rooms  (id,segment_id, name, type) VALUES (94,(SELECT id FROM segments WHERE floor_id=1 and direction='UL'), 'Room 6', 'FR');
          INSERT INTO Rooms  (id,segment_id, name, type) VALUES (95,(SELECT id FROM segments WHERE floor_id=1 and direction='UL'), 'Room 5', 'FR');
          INSERT INTO Rooms  (id,segment_id, name, type) VALUES (96,(SELECT id FROM segments WHERE floor_id=1 and direction='UL'), 'Room 4', 'FR');
          INSERT INTO Rooms  (id,segment_id, name, type) VALUES (97,(SELECT id FROM segments WHERE floor_id=1 and direction='UL'), 'Room 3', 'FR');
          INSERT INTO Rooms  (id,segment_id, name, type) VALUES (98,(SELECT id FROM segments WHERE floor_id=1 and direction='UL'), 'Room 2', 'FR');

          INSERT INTO Rooms  (id,segment_id, name, type) VALUES (99,(SELECT id FROM segments WHERE floor_id=1 and direction='LM'), 'Room 1', 'FR');
          INSERT INTO Rooms  (id,segment_id, name, type) VALUES (100,(SELECT id FROM segments WHERE floor_id=1 and direction='LM'), 'Lab 4(CS)', 'LR');
          INSERT INTO Rooms  (id,segment_id, name, type) VALUES (101,(SELECT id FROM segments WHERE floor_id=1 and direction='LM'), 'Room 20', 'FR');
          INSERT INTO Rooms  (id,segment_id, name, type) VALUES (102,(SELECT id FROM segments WHERE floor_id=1 and direction='LM'), 'Room 21', 'FR');
          INSERT INTO Rooms  (id,segment_id, name, type) VALUES (103,(SELECT id FROM segments WHERE floor_id=1 and direction='LM'), 'Room 22', 'FR');
          INSERT INTO Rooms  (id,segment_id, name, type) VALUES (104,(SELECT id FROM segments WHERE floor_id=1 and direction='LM'), 'Room 23', 'FR');


          INSERT INTO Rooms  (id,segment_id, name, type) VALUES (105,(SELECT id FROM segments WHERE floor_id=1 and direction='RM'), 'Faculty Room', 'FR');
          INSERT INTO Rooms  (id,segment_id, name, type) VALUES (106,(SELECT id FROM segments WHERE floor_id=1 and direction='RM'), 'Procurement Department', 'DEP');

          INSERT INTO Rooms  (id,segment_id, name, type) VALUES (107,(SELECT id FROM segments WHERE floor_id=1 and direction='UR'), 'Accounts Department', 'DEP');
          INSERT INTO Rooms  (id,segment_id, name, type) VALUES (108,(SELECT id FROM segments WHERE floor_id=1 and direction='UR'), 'Mr Abdul Saeed', 'FR');
          INSERT INTO Rooms  (id,segment_id, name, type) VALUES (109,(SELECT id FROM segments WHERE floor_id=1 and direction='UR'), 'Assistant manager admin office', 'Adm');


          INSERT INTO Rooms  (id,segment_id, name, type) VALUES (110,(SELECT id FROM segments WHERE floor_id=2 and direction='UL'), 'Male wash room', 'WR');
          INSERT INTO Rooms  (id,segment_id, name, type) VALUES (111,(SELECT id FROM segments WHERE floor_id=2 and direction='UL'), 'S2', 'SR');
          INSERT INTO Rooms  (id,segment_id, name, type) VALUES (112,(SELECT id FROM segments WHERE floor_id=2 and direction='UL'), 'Room 17 (HOD office)', 'HO');
          INSERT INTO Rooms  (id,segment_id, name, type) VALUES (113,(SELECT id FROM segments WHERE floor_id=2 and direction='UL'), 'Room 15(Secretariat)', 'Adm');
          INSERT INTO Rooms  (id,segment_id, name, type) VALUES (114,(SELECT id FROM segments WHERE floor_id=2 and direction='UL'), 'Room 14', 'FR');
          INSERT INTO Rooms  (id,segment_id, name, type) VALUES (115,(SELECT id FROM segments WHERE floor_id=2 and direction='UL'), 'R11', 'SR');
          INSERT INTO Rooms  (id,segment_id, name, type) VALUES (116,(SELECT id FROM segments WHERE floor_id=2 and direction='UL'), 'S2', 'SR');


          INSERT INTO Rooms  (id,segment_id, name, type) VALUES (117,(SELECT id FROM segments WHERE floor_id=2 and direction='UR'), 'HR & QEC Department', 'DEP');
          INSERT INTO Rooms  (id,segment_id, name, type) VALUES (118,(SELECT id FROM segments WHERE floor_id=2 and direction='UR'), 'Room 8(Manager Administration)', 'Adm');
          INSERT INTO Rooms  (id,segment_id, name, type) VALUES (119,(SELECT id FROM segments WHERE floor_id=2 and direction='UR'), 'Room 6B', 'FR');
          INSERT INTO Rooms  (id,segment_id, name, type) VALUES (120,(SELECT id FROM segments WHERE floor_id=2 and direction='UR'), 'Room 6A', 'FR');
          INSERT INTO Rooms  (id,segment_id, name, type) VALUES (121,(SELECT id FROM segments WHERE floor_id=2 and direction='UR'), 'Room 3(Director Secretariat)', 'Adm');
          INSERT INTO Rooms  (id,segment_id, name, type) VALUES (122,(SELECT id FROM segments WHERE floor_id=2 and direction='UR'), 'Room 2(Director)', 'DIR');
          INSERT INTO Rooms  (id,segment_id, name, type) VALUES (123,(SELECT id FROM segments WHERE floor_id=2 and direction='UR'), 'OneStop', 'Adm');


          INSERT INTO Rooms  (id,segment_id, name, type) VALUES (124,(SELECT id FROM segments WHERE floor_id=2 and direction='LL'), 'Faculty Room', 'FR');

          INSERT INTO Rooms  (id,segment_id, name, type) VALUES (125,(SELECT id FROM segments WHERE floor_id=2 and direction='LR'), 'LLC', 'SR');
          INSERT INTO Rooms  (id,segment_id, name, type) VALUES (126,(SELECT id FROM segments WHERE floor_id=2 and direction='LR'), 'Room 5(Conference Room)', 'CR');
          INSERT INTO Rooms  (id,segment_id, name, type) VALUES (127,(SELECT id FROM segments WHERE floor_id=2 and direction='LR'), 'Room 4', 'FR');


          INSERT INTO Rooms  (id,segment_id, name, type) VALUES (128,(SELECT id FROM segments WHERE floor_id=3 and direction='UL'), 'E4', 'SR');
          INSERT INTO Rooms  (id,segment_id, name, type) VALUES (129,(SELECT id FROM segments WHERE floor_id=3 and direction='UL'), 'E5', 'SR');
          INSERT INTO Rooms  (id,segment_id, name, type) VALUES (130,(SELECT id FROM segments WHERE floor_id=3 and direction='UL'), 'E6', 'SR');
          INSERT INTO Rooms  (id,segment_id, name, type) VALUES (131,(SELECT id FROM segments WHERE floor_id=3 and direction='UL'), 'Male faculty wash room', 'WR');
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
          INSERT INTO Rooms  (id,segment_id, name, type) VALUES (143,(SELECT id FROM segments WHERE floor_id=3 and direction='LL'), 'Lab 2(Networking& CYS Lab)', 'LR');

          INSERT INTO Rooms  (id,segment_id, name, type) VALUES (144,(SELECT id FROM segments WHERE floor_id=3 and direction='LR'), 'R106', 'SR');
          INSERT INTO Rooms  (id,segment_id, name, type) VALUES (145,(SELECT id FROM segments WHERE floor_id=3 and direction='LR'), 'Network Operation Center', 'OC');
          INSERT INTO Rooms  (id,segment_id, name, type) VALUES (146,(SELECT id FROM segments WHERE floor_id=3 and direction='LR'), 'Lab 1', 'LR');


          --Multi-Purpose

          INSERT INTO Rooms  (id,segment_id, name, type) VALUES (147,(SELECT id FROM segments WHERE floor_id=9 and direction='M'), 'Library', 'LH');

          INSERT INTO Rooms  (id,segment_id, name, type) VALUES (148,(SELECT id FROM segments WHERE floor_id=10 and direction='M'), 'Auditorium', 'AR');
          INSERT INTO Rooms  (id,segment_id, name, type) VALUES (149,(SELECT id FROM segments WHERE floor_id=10 and direction='UR'), 'Conference Room', 'CR');


          INSERT INTO Rooms  (id,segment_id, name, type) VALUES (150,(SELECT id FROM segments WHERE floor_id=10 and direction='LL'), 'Medical room', 'WR');
          INSERT INTO Rooms  (id,segment_id, name, type) VALUES (151,(SELECT id FROM segments WHERE floor_id=10 and direction='LL'), 'Male wash room', 'WR');
          INSERT INTO Rooms  (id,segment_id, name, type) VALUES (152,(SELECT id FROM segments WHERE floor_id=10 and direction='LL'), 'Female wash room', 'WR');


          INSERT INTO Rooms  (id,segment_id, name, type) VALUES (153,(SELECT id FROM segments WHERE floor_id=11 and direction='M'), 'Cafeteria', 'Cafe');
          INSERT INTO Rooms  (id,segment_id, name, type) VALUES (154,(SELECT id FROM segments WHERE floor_id=11 and direction='LL'), 'Male wash room', 'WR');
          INSERT INTO Rooms  (id,segment_id, name, type) VALUES (155,(SELECT id FROM segments WHERE floor_id=11 and direction='LL'), 'Female wash room', 'WR');


          INSERT INTO Rooms  (id,segment_id, name, type) VALUES (156,(SELECT id FROM segments WHERE floor_id=6 and direction='M'), 'Faculty office', 'FR');

          
        END IF;
    END $$;

  `);

}

module.exports = {
  dbSetup,
  query
};