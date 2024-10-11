const validateFolderParams = (parameters, type) => {
    
    if(type==='c'){
        if(!parameters.name || !parameters.repo_id){
            throw Error("Please fill all the required fields.");
        }
    }
    else if(type==='u'){
        if(!parameters.id || (!parameters.name && !parameters.parent_id)){
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
    validateFolderParams
}