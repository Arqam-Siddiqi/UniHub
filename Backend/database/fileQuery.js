const {query} = require('./psqlWrapper');

const queryFilesFromRepo = async (repo_id) => {

    const files = await query(`
        SELECT * FROM Files
        WHERE repo_id = $1
    `, [repo_id]);

    return files.rows;

}

const queryFilesByParent = async ({repo_id, folder_id}, user_id) => {

    let files;
    if(folder_id){
        files = await query(`
            SELECT * FROM Files f
            JOIN Repos r ON f.repo_id = r.id
            JOIN Users u ON r.user_id = u.id
            WHERE f.repo_id = $1 AND f.folder_id = $2 AND (r.visibility = 'public' OR r.user_id = $3);
        `, [repo_id, folder_id, user_id]);
    }
    else{
        files = await query(`
            SELECT * FROM Files f
            JOIN Repos r ON f.repo_id = r.id
            JOIN Users u ON r.user_id = u.id
            WHERE f.repo_id = $1 AND f.folder_id IS NULL AND (r.visibility = 'public' OR r.user_id = $2);
        `, [repo_id, user_id]);
    }
    
    return files.rows;
}

const createFile = async ({name, extension, fileSize, repo_id, folder_id, mimeType}) => {
    
    const file = await query(`
        INSERT INTO Files (name, extension, fileSize, repo_id, folder_id, mimetype)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *;
    `, [name, extension, fileSize, repo_id, folder_id ?? null, mimeType]);

    return file.rows[0];

}

const updateFileByID = async (id, {name, extension, mimeType, google_file_id}) => {

    const file = await query(`
        UPDATE Files
        SET name = COALESCE($1, name), 
            extension = COALESCE($2, extension), 
            mimeType = COALESCE($3, mimeType),
            google_file_id = COALESCE($4, google_file_id)
        WHERE id = $5
        RETURNING *;
    `, [name, extension, mimeType, google_file_id, id]);

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

const queryFileByID = async (id, user_id) => {

    const file = await query(`
        SELECT * FROM Files f
        JOIN Repos r ON f.repo_id = r.id
        JOIN Users u ON r.user_id = u.id
        WHERE f.id = $1 AND (r.visibility = 'public' OR r.user_id = $2)
    `, [id, user_id]);

    return file.rows[0];

}

const queryFileByIDAndUser = async (id, user_id) => {

    const file = await query(`
        SELECT * FROM Files f
        JOIN Repos r ON f.repo_id = r.id
        JOIN Users u ON r.user_id = u.id
        WHERE f.id = $1 AND u.id = $2;
    `, [id, user_id]);

    return file.rows[0];

}

module.exports = {
    queryFilesFromRepo,
    queryFilesByParent,
    createFile,
    updateFileByID,
    deleteFileByID,
    queryFileByID,
    queryFileByIDAndUser
}