const {query} = require('./psqlWrapper');

const queryMap = async () => {

    const map = await query(`
        SELECT 
            b.id AS "building_id",
            b.name AS "building_name",
            f.id AS "floor_id",
            f.name AS "floor_name",
            f.level,
            s.id AS "segment_id",
            s.direction,
            r.id AS "room_id",
            r.name AS "room_name",
            r.type AS "room_type",
            rt.name AS "room_type_name"
        FROM Buildings b 
        JOIN Floors f ON b.id = f.building_id
        JOIN Segments s ON f.id = s.floor_id
        JOIN Rooms r ON s.id = r.segment_id
        JOIN Room_Types rt ON r.type = rt.code
        ORDER BY
            CASE b.id
                WHEN 3 THEN 1
                WHEN 1 THEN 2
                WHEN 2 THEN 3
            END, 
            f.level,
            CASE s.direction
                WHEN 'UL' THEN 1
                WHEN 'LM' THEN 2
                WHEN 'M' THEN 3
                WHEN 'RM' THEN 4
                WHEN 'UR' THEN 5
                WHEN 'LL' THEN 6
                WHEN 'LR' THEN 7
            END,
            r.id;
    `);
    
    return map.rows;
}

const queryFacultyByRoom = async (room_id) => {

    const faculty = await query(`
        SELECT ARRAY_AGG(f.name) AS names 
        FROM Faculty f
        WHERE f.room_id = $1;
    `, [room_id]);

    return faculty.rows[0]?.names || [];
    
}

const queryAllFaculty = async () => {

    const faculty = await query(`
        SELECT
            fc.name, 
            r.name AS "room_name", 
            f.name AS "floor_name", 
            b.name AS "building_name"
        FROM Faculty fc
        JOIN Rooms r ON fc.room_id = r.id
        JOIN Segments s ON r.segment_id = s.id
        JOIN Floors f ON s.floor_id = f.id
        JOIN Buildings b ON f.building_id = b.id
        ORDER BY b.id;
    `, []);
    
    return faculty.rows;
}

const queryAllRooms = async () => {

    const rooms = await query(`
        SELECT 
            b.name AS "building_name",
            f.name AS "floor_name",
            r.name AS "room_name",
            rt.name AS "room_type_name"
        FROM Buildings b 
        JOIN Floors f ON b.id = f.building_id
        JOIN Segments s ON f.id = s.floor_id
        JOIN Rooms r ON s.id = r.segment_id
        JOIN Room_Types rt ON r.type = rt.code
		ORDER BY b.id;    
    `, []);

    return rooms.rows;

}

module.exports = {
    queryMap,
    queryFacultyByRoom,
    queryAllFaculty,
    queryAllRooms
}

// SELECT 
// COUNT(*)
// FROM Buildings b 
// JOIN Floors f ON b.id = f.building_id
// JOIN Segments s ON f.id = s.floor_id
// JOIN Rooms r ON s.id = r.segment_id
// JOIN Room_Types rt ON r.type = rt.code;