const validateRepoParams = (parameters, type) => {
    
    
    if(type==='c'){
        if( !parameters.name || !parameters.repo_id){
            throw Error("Please fill all the required fields.");
        }
    
        
        
       
    }
    
    else if(type==='u'){
        if(!parameters.id || (!parameters.name && !parameters.parent_id)){
            throw Error("Please fill all the required fields.");
        } 
    }
    else if(type==='d'){
        if(!parameters.id){
            throw Error("Please fill all the required fields.");
        } 
    }
    
    // return {
    //     user_id,
    //     name,
    //     visibility,
    //     description
    // };
    return parameters;
}


module.exports = {
    validateRepoParams
}