const {query} = require('./psqlWrapper');

const queryFilesFromRepo = async (repo_id) => {

    const files = await query(`
        SELECT * FROM Files
        WHERE repo_id = $1
    `, [repo_id]);

    return files.rows;

}

const queryFilesByParent = async ({repo_id, folder_id}) => {

    let files;
    if(folder_id){
        files = await query(`
            SELECT * FROM Files
            WHERE repo_id = $1 AND folder_id = $2;
        `, [repo_id, folder_id]);
    }
    else{
        files = await query(`
            SELECT * FROM Files
            WHERE repo_id = $1 AND folder_id IS NULL;
        `, [repo_id]);
    }
    
    return files.rows;
}

const createFile = async ({name, extension, fileSize, repo_id, folder_id}) => {
    
    const file = await query(`
        INSERT INTO Files (name, extension, fileSize, repo_id, folder_id)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *;
    `, [name, extension, fileSize, repo_id, folder_id ?? null]);

    return file.rows[0];

}

const updateFileByID = async (id, {name, extension, folder_id}) => {

    const file = await query(`
        UPDATE Files
        SET name = COALESCE($1, name), extension = COALESCE($2, extension)
        WHERE id = $3
        RETURNING *;
    `, [name, extension, id]);

    return file.rows[0];

}

const deleteFileByID = async (id) => {

    const file = await query(`
        DELETE FROM Files
        WHERE id = $1
        RETURNING *;
    `, [id]);

    return file.rows[0];

}

module.exports = {
    queryFilesFromRepo,
    queryFilesByParent,
    createFile,
    updateFileByID,
    deleteFileByID
}