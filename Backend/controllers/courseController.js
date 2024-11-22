const {google} = require('googleapis');
const {differenceInMonths} = require('date-fns');

const courseQuery = require('../database/courseQuery');
const userQuery = require('../database/userQuery');

const refreshUserCourses = async (req, res, next) => {

    try{
        const user_id = req.user;
        const google_token = await userQuery.queryUserGoogleTokens(user_id);

        let {access_token, refresh_token} = google_token;

        const oauth2Client = new google.auth.OAuth2();
        
        oauth2Client.setCredentials({
            access_token: access_token,
            refresh_token: refresh_token 
        });

        try {
            access_token = await oauth2Client.getAccessToken();
            // console.log('Access token is valid:', ticket);
        } catch (error) {
            return res.status(403).send({"Error": "Access token is invalid or expired. Please login again."});
        }

        try {
            await oauth2Client.getRequestHeaders();
            // console.log('New access token:', tokens.credentials.access_token);
        } catch (error) {
            return res.status(403).send({"Error": "Refresh token is invalid or expired. Please login again."});
        }

        await courseQuery.deleteUserCourses(user_id);

        const classroom = google.classroom({version: 'v1', auth: oauth2Client});
        
        const courses_res = await classroom.courses.list({
            courseStates: 'ACTIVE'
        });
        const courses = courses_res.data.courses || [];
        
        const today = new Date();
        result = [];

        
        for(const course of courses){
            const courseId = course.id;

            if(differenceInMonths(today, new Date(course.creationTime)) >= 5){
                continue;
            }
            
            const course_insert = await courseQuery.createCourse(user_id, course);

            const assignments_res = await classroom.courses.courseWork.list({
                courseId,
                orderBy: 'dueDate desc'
            });

            
            // the scope for coursework only has .me in it???
            const assignments = assignments_res.data.courseWork || [];
            
            for(const assignment of assignments){

                if(assignment.dueDate){
                    const formatted_dueDate = new Date(assignment.dueDate.year, assignment.dueDate.month - 1, assignment.dueDate.day, assignment.dueTime.hours, assignment.dueTime.minutes);
                    if(formatted_dueDate >= today){
                        assignment.dueDate = formatted_dueDate;
                        
                        const submissions_res = await classroom.courses.courseWork.studentSubmissions.list({
                            courseId,
                            courseWorkId: assignment.id,
                        });

                        const submissions = submissions_res.data.studentSubmissions || [];

                        const hasSubmitted = submissions.some(submission => submission.state === 'TURNED_IN' || submission.state === 'RETURNED');
                        
                        if(!hasSubmitted){  
                            await courseQuery.createAssignment(course_insert.id, assignment);      
                        }
                    }
                    else{
                        break;
                    }
                }
                
            }

        }

        next();
    }
    catch(error){
        res.status(400).send({"Error": error.message});
    }

}

const getUserCourses = async (req, res) => {

    try{
        const user_id = req.user;

        const courses = await courseQuery.queryUserCourses(user_id);

        res.status(200).send(courses);
    }
    catch(error){
        res.status(400).send({"Error": error.message});
    }

}

module.exports = {
    getUserCourses,
    refreshUserCourses
}