const bcrypt = require('bcrypt');
const {google} = require('googleapis');

const authQuery = require('../database/authQuery');
const userQuery = require('../database/userQuery');
const {validateUserParams, createJWT} = require('../utils/userUtils');

const googleSignIn = async (req, res) => {

    try{
        const token = createJWT(req.user.id);
        
        // const {access_token, refresh_token} = req.user;

        // const oauth2Client = new google.auth.OAuth2();
        
        // oauth2Client.setCredentials({
        //     access_token: access_token,
        //     refresh_token: refresh_token 
        // });

        // const classroom = google.classroom({version: 'v1', auth: oauth2Client});
        
        // const courses_res = await classroom.courses.list();
        // const courses = courses_res.data.courses || [];
        
        // const today = new Date();
        // console.log("");
        // for(const course of courses){
        //     const courseId = course.id;

        //     const assignments_res = await classroom.courses.courseWork.list({courseId});
        //     // the scope for coursework only has .me in it???
        //     const assignments = assignments_res.data.courseWork || [];

        //     for(const assignment of assignments){
        //         if(assignment.dueDate && new Date(assignment.dueDate.year, assignment.dueDate.month - 1, assignment.dueDate.day) >= today){
        //             console.log(`Pending Assignment: ${assignment.title}`);
        //             console.log(`Course: ${course.name}`);
        //             console.log(`Due: ${assignment.dueDate ? `${assignment.dueDate.month}/${assignment.dueDate.day}/${assignment.dueDate.year}` : 'No due date'}`);
        //             console.log('-------------------------------');
        //         }
                
        //         // const submissions_res = await classroom.courses.courseWork.studentSubmissions.list({
        //         //     courseId,
        //         //     courseWorkId: assignment.id,
        //         //     states: ['CREATED', 'NEW']
        //         // });
                
        //         // const submissions = submissions_res.data.studentSubmissions || [];
                
        //         // for (const submission of submissions) {
        //         //     if (submission.state === 'CREATED' || submission.state === 'NEW' and ) {
                        
        //         //     }
        //         // }
        //     }

        // }
        

        // console.log(courses);

        const params = new URLSearchParams({
            name: req.user.name,
            jwt: token,
            googleVerified: true
        }).toString();

        res.redirect(`${process.env.FRONTEND}/user-page?${params}`);
    }
    catch(error){
        res.status(400).send({"Error": error.message});
    }

}

const signup = async (req, res) => {

    try{
        const {name, password, email} = await validateUserParams(req.body);
        
        const user = await authQuery.createLocalUser(name, password, email);

        const token = createJWT(user.id);

        res.status(200).send({name: user.name, jwt: token, googleVerified: false});
    }
    catch(error){
        res.status(400).send({"Error": error.message});
    }

}

const login = async (req, res) => {

    try{
        const {email, password} = req.body;

        const user = await userQuery.queryUserByEmail(email);
        
        if(!user || !user.password){
            throw Error("Invalid credentials.");
        }

        const match = await bcrypt.compare(password, user.password);

        if(!match){
            throw Error("Invalid credentials");
        }

        const token = createJWT(user.id);

        res.status(200).send({name: user.name, jwt: token, googleVerified: false});
    }
    catch(error){
        res.status(400).send({"Error": error.message});
    }

}

module.exports = {
    signup,
    login,
    googleSignIn
}