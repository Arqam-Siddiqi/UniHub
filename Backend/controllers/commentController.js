const {validateCommentParams} =  require('../utils/commentUtils');
const commentQuery=require('../database/commentQuery');

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

        res.status(200).send(comments);
    }
    catch(error){
        res.status(400).send({"Error": error.message});
    }
}

const getAllRepoComments = async(req, res)=>{
    try{
        if(!req.body.repo_id){
            throw Error('Give a repo id');
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
        
        const validated_params = validateCommentParams(user_id,req.body, 'c');
        const comment=await commentQuery.comment(user_id,validated_params.repo_id, validated_params.content);
        
        
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
        let owned= await commentQuery.queryByUser(user_id);
        owned=owned.map(data=>data.id);
        if(!owned.includes(req.body.id)){
            throw Error('No such comment exists for this user');
        }
        const comment=await commentQuery._delete(validated_params.id); 
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
