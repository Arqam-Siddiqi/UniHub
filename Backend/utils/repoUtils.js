
const validateRepoParams = (user_id, parameters, type) => {
    
    if(parameters.visibility){
        const possible_visibilities = ['public', 'private'];
        if(!possible_visibilities.includes(parameters.visibility)){
            throw Error("Invalid Repository Visibility.");
        }
    }
    
    if(type==='c'){
        
        if(!user_id || !parameters.name || !parameters.visibility || !parameters.description){
            throw Error("Please fill all the required fields.");
        }

    }
    else if(type==='u'){
        
        if(!parameters.id || (!parameters.name && !parameters.description && !parameters.visibility)){
            throw Error("Please fill the required fields.");
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