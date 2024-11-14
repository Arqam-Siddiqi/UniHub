const {validateCommentParams} =  require('../utils/commentUtils');
const commentQuery=require('../database/commentQuery');
const userQuery = require('../database/userQuery');


const getUser = async (comment, user_id)=>{
    const user= await userQuery.queryUserByID(user_id);
    const username=user.name;
    
    const email=user.email;
    if(Array.isArray(comment))
    for(i=0; i<comment.length; i++){
        comment[i].name=username;
        comment[i].email=email;
    }
    else
    {
        comment.name=username;
        comment.email=email;
    }
    
}

const getAllComments = async(req, res)=>{
    try{
        const comments = await commentQuery.queryAllComments();

        res.status(200).send(comments);
    }
    catch(error){
        res.status(400).send({"Error": error.message});
    }
}

const getAllUserComments = async(req, res)=>{
    try{
        const comments = await commentQuery.queryByUser(req.user);
        await getUser(comments, req.user);
        // const user= await userQuery.queryUserByID(req.user);
        // const user_name=user.name;
        // const email=user.email;
        // const details={user_name,email};
        // res.status(200).send({details,comments});
        res.status(200).send(comments);
    }
    catch(error){
        res.status(400).send({"Error": error.message});
    }
}

const getAllRepoComments = async(req, res)=>{
    
    try{
        if(!req.body.repo_id){
            throw Error('Please send repo_id.');
        }
        const comments = await commentQuery.queryByRepo(req.body.repo_id);
        
        res.status(200).send(comments);
    }
    catch(error){
        res.status(400).send({"Error": error.message});
    }

}
const createComment = async (req, res) => {

    try{
        const user_id = req.user;
        
        const validated_params = validateCommentParams(user_id, req.body, 'c');
        const comment = await commentQuery.comment(user_id, validated_params.repo_id, validated_params.content);
        // const user= await userQuery.queryUserByID(user_id);
        // const user_name=user.name;
        // comment.name=user_name;
        // const email=user.email;
        // comment.email=email;
        await getUser(comment, user_id);
        
        res.status(200).send(comment);
    }
    catch(error){
        res.status(400).send({"Error": error.message});
    }
    
}

const updateComment =async(req,res)=>{
    try{
        const user_id = req.user;
        
        const validated_params = validateCommentParams(user_id,req.body, 'u');
        let owned= await commentQuery.queryByUser(user_id);
        owned=owned.map(data=>data.id);
        if(!owned.includes(req.body.id)){
            throw Error('The comment was not made by this user');
        }
        const comment=await commentQuery.update(validated_params.id, validated_params.content); 
        await getUser(comment,user_id);
        res.status(200).send(comment);
    }
    catch(error){
        res.status(400).send({"Error": error.message});
    }
}

const deleteComment = async (req,res)=>{

    try{
        const user_id = req.user;
        
        const validated_params = validateCommentParams(user_id,req.body, 'd');

        const check = await commentQuery.belongsToUser(validated_params.id, user_id);
        
        if(!check){
            throw Error("This comment does not belong to this user.");
        }

        const comment = await commentQuery._delete(validated_params.id);
        await getUser(comment, user_id);

        res.status(200).send(comment);
    }
    catch(error){
        res.status(400).send({"Error": error.message});
    }

}
module.exports={
    getAllComments,
    createComment,
    getAllUserComments,
    getAllRepoComments,
    updateComment,
    deleteComment
}
