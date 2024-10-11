const fileQuery = require('../database/fileQuery');

// call with await
const validateFileParams = async ({name, extension, fileSize, repo_id, folder_id}) => {

    if(!name || !extension || !fileSize || !repo_id){
        throw Error("Please fill all the required fields.");
    }

    if(extension.length > 8){
        throw Error("Extensions can only be of 8 or less letters.");
    }

    const files = await fileQuery.queryFilesByParent({repo_id, folder_id});
    const names = files.map(data => data.name);

    if(names.includes(name)){
        throw Error(`There already exists a file named \"${name}\" in the same directory.`)
    }

    if(fileSize > parseInt(process.env.MAX_FILE_SIZE, 10)){
        throw Error("File size is greater than 30 MB.");
    }

    return {
        name,
        extension,
        fileSize,
        repo_id,
        folder_id
    }

}

module.exports = {
    validateFileParams
}