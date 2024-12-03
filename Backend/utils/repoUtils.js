const max_tags = 10;

const validateRepoParams = (user_id, parameters, type) => {
    
    if(parameters.visibility){
        const possible_visibilities = ['public', 'private'];
        if(!possible_visibilities.includes(parameters.visibility)){
            throw Error("Invalid Repository Visibility.");
        }
    }
    
    if(type==='c'){
        
        if(!user_id || !parameters.name || !parameters.visibility){
            throw Error("Please fill all the required fields.");
        }

    }
    else if(type==='u'){
        
        if(!parameters.id || (!parameters.name && !parameters.description && !parameters.visibility && !parameters.tags)){
            throw Error("Please fill the required fields.");
        }

    }
    else if(type==='d'){
        
        if(!parameters.id){
            throw Error("Please fill all the required fields.");
        }

    }

    if(typeof parameters.tags !== "undefined"){

        if(parameters.tags.length > max_tags){
            throw Error(`The maximum number of allowed tags is ${max_tags}.`);
        }

        parameters.tags = parameters.tags.map(element => element.trim());
    }
    
    return parameters;
}


module.exports = {
    validateRepoParams
}