
const validateRepoParams = (user_id, {name, visibility, description}) => {

    if(!user_id || !name || !visibility || !description){
        throw Error("Please fill all the required fields.");
    }

    const possible_visibilities = ['public', 'private'];
    if(!possible_visibilities.includes(visibility)){
        throw Error("Invalid Repository Visibility.");
    }
    
    return {
        user_id,
        name,
        visibility,
        description
    };

}

module.exports = {
    validateRepoParams
}