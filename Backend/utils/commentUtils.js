const validateCommentParams = (id, parameters, type) => {
    
    if(type==='c'){
        if(!parameters.repo_id || !id || !parameters.content){
            throw Error("Please fill all the required fields.");
        }
    }
    else if(type==='u'){
        if(!parameters.id||!parameters.content){
            throw Error("Please fill the required fields.");
        } 
    }
    else if(type==='d'){
        if(!parameters.id){
            throw Error("Please fill the required fields.");
        } 
    }

    return parameters;
}


module.exports = {
    validateCommentParams
}