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

const createAssignment = async (course_id, user_id, {title, alternateLink, description, maxPoints, dueDate, creationTime}) => {

    let assignment;
    try {
        await query('BEGIN'); // Added BEGIN for transactional safety

        assignment = await query(`
            INSERT INTO Assignments (course_id, title, link, description, max_points, due_date, created_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            ON CONFLICT (link) DO UPDATE
            SET 
                title = EXCLUDED.title,
                description = EXCLUDED.description,
                max_points = EXCLUDED.max_points,
                due_date = EXCLUDED.due_date,
                created_at = EXCLUDED.created_at
            RETURNING *;
        `, [course_id, title, alternateLink, description, maxPoints, dueDate, creationTime]);

        // Insert into User_Assignments
        await query(`
            INSERT INTO User_Assignments (user_id, assignment_id)
            VALUES ($1, $2)
            ON CONFLICT DO NOTHING;
        `, [user_id, assignment.rows[0].id]); // New query to link assignment to user

        await query('COMMIT'); // Added COMMIT to finalize changes
    } catch (error) {
        await query('ROLLBACK'); // Added ROLLBACK for error handling
        throw error;
    }

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
        LEFT JOIN User_Assignments ua ON ua.user_id = uc.user_id AND ua.assignment_id IN (
            SELECT id FROM Assignments WHERE course_id = c.id
        ) -- Ensures assignments are tied to the course
        LEFT JOIN Assignments a ON ua.assignment_id = a.id -- Include assignments only if they exist
        WHERE uc.user_id = $1
        ORDER BY a.due_date, c.name;
    `, [user_id]);
    
    return courses.rows;

}

const queryUserAssignments = async (user_id) => {

    const assignments = await query(`
        SELECT 
            a.*, 
            c.name AS "course_name", 
            c.link AS "course_link" 
        FROM User_Assignments ua -- Changed to join User_Assignments
        JOIN Assignments a ON ua.assignment_id = a.id -- Join on assignment_id
        JOIN Courses c ON a.course_id = c.id
        WHERE ua.user_id = $1 -- Filter by user_id in User_Assignments
        ORDER BY a.due_date;
    `, [user_id]);

    return assignments.rows;

}

const deleteUserCourses = async (user_id) => {

    try {
        await query('BEGIN'); // Added BEGIN for transactional safety

        // Delete from User_Assignments first
        await query(`
            DELETE FROM User_Assignments
            WHERE user_id = $1;
        `, [user_id]); // Added query to clean up User_Assignments

        const courses = await query(`
            DELETE FROM User_Courses
            WHERE user_id = $1
            RETURNING *;
        `, [user_id]);

        await query('COMMIT'); // Added COMMIT to finalize changes

        return courses.rows;
    } catch (error) {
        await query('ROLLBACK'); // Added ROLLBACK for error handling
        throw error;
    }

}

const deleteInActiveAssignments = async () => {

    await query(`
        DELETE FROM Assignments
        WHERE NOT EXISTS (
            SELECT 1 
            FROM User_Assignments ua 
            WHERE ua.assignment_id = Assignments.id
        );
    `, []);

}

module.exports = {
    createCourse,
    queryUserCourses,
    createAssignment,
    queryUserAssignments,
    deleteUserCourses,
    deleteInActiveAssignments
}