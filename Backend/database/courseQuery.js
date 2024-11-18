const {query} = require('./psqlWrapper');


const createCourse = async (user_id, {name, descriptionHeading, alternateLink, creationTime}) => {

    const course = await query(`
        INSERT INTO Courses (user_id, name, link, description, created_at)
        VALUES ($1, $2, $3, $4, $5) 
        RETURNING *;
    `, [user_id, name, alternateLink, descriptionHeading, creationTime]);

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
        SELECT c.name, c.link AS "course_link", c.description AS "course_description", a.title, a.link AS "assignment_link", a.description AS "assignment_description", a.max_points, a.due_date, a.created_at FROM Assignments a
        RIGHT JOIN Courses c ON a.Course_ID = c.ID
        WHERE c.user_id = $1;
    `, [user_id])

    return courses.rows;

}

const queryUserAssignments = async (user_id) => {

    const assignments = await query(`
        SELECT * FROM Assignments a
        JOIN Courses c ON a.course_id = c.course_id
        WHERE user_id = $1
    `, [user_id]);

    return assignments.rows;

}

const deleteUserCourses = async (user_id) => {

    const assignments = await query(`
        DELETE FROM Courses
        WHERE user_id = $1
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