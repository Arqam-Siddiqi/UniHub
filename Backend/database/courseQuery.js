const {query} = require('./psqlWrapper');


const createCourse = async (user_id, {name, descriptionHeading, alternateLink, creationTime}) => {

    let course;
    try{
        await query('BEGIN');

        course = await query(`
            INSERT INTO Courses (name, link, description, created_at)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (link) DO UPDATE
            SET description = EXCLUDED.description, created_at = EXCLUDED.created_at
            RETURNING *;
        `, [name, alternateLink, descriptionHeading, creationTime]);

        await query(`
            INSERT INTO User_Courses (user_id, course_id)
            VALUES ($1, $2)
            ON CONFLICT DO NOTHING;
        `, [user_id, course.rows[0].id]);

        await query('COMMIT');
    }
    catch(error){
        await query('ROLLBACK');
        throw error;
    }

    return course.rows[0];

}

const createAssignment = async (course_id, {title, alternateLink, description, maxPoints, dueDate, creationTime}) => {

    const assignment = await query(`
        INSERT INTO Assignments (course_id, title, link, description, max_points, due_date, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *;
    `, [course_id, title, alternateLink, description, maxPoints, dueDate, creationTime]);
    
    return assignment.rows[0];

}


const queryUserCourses = async (user_id) => {

    const courses = await query(`
        SELECT 
            c.name, 
            c.link AS "course_link", 
            c.description AS "course_description", 
            a.title, 
            a.link AS "assignment_link", 
            a.description AS "assignment_description", 
            a.max_points, 
            a.due_date, 
            a.created_at 
        FROM User_Courses uc
        JOIN Courses c ON uc.course_id = c.id
        LEFT JOIN Assignments a ON a.course_id = c.id
        WHERE uc.user_id = $1
        ORDER BY a.due_date;
    `, [user_id])

    return courses.rows;

}

const queryUserAssignments = async (user_id) => {

    const assignments = await query(`
        SELECT 
            a.*, 
            c.name AS "course_name", 
            c.link AS "course_link" 
        FROM User_Courses uc
        JOIN Courses c ON uc.course_id = c.id
        JOIN Assignments a ON a.course_id = c.id
        WHERE uc.user_id = $1
        ORDER BY a.due_date;
    `, [user_id]);

    return assignments.rows;

}

const deleteUserCourses = async (user_id) => {

    const assignments = await query(`
        DELETE FROM User_Courses
        WHERE user_id = $1
        RETURNING *;
    `, [user_id]);

    return assignments.rows;

}

module.exports = {
    createCourse,
    queryUserCourses,
    createAssignment,
    queryUserAssignments,
    deleteUserCourses
}