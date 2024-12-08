const {query} = require('./psqlWrapper');

const queryFilesFromRepo = async (repo_id, user_id) => {

    const files = await query(`
        SELECT f.* FROM Files f
        JOIN Repos r ON f.repo_id = r.id
        JOIN Users u ON r.user_id = u.id
        WHERE f.repo_id = $1 AND (r.visibility = 'public' OR r.user_id = $2);
    `, [repo_id, user_id]);

    return files.rows;

}

// Used to find all children files of a Folder X.
// This includes children files that belong to a child folder of Folder X
const queryFilesByFolder = async (folder_id, user_id) => {

    try {
        await query('BEGIN');

        const subfolderResult = await client.query(`
            WITH RECURSIVE Subfolders AS (
                SELECT folder_id
                FROM Folders
                WHERE parent_folder_id = $1
                UNION ALL
                SELECT f.folder_id
                FROM Folders f
                INNER JOIN Subfolders sf ON f.parent_folder_id = sf.folder_id
            )
            SELECT folder_id FROM Subfolders;
        `, [folder_id]);

        const subfolderIds = subfolderResult.rows.map(row => row.folder_id);

        const allFolderIds = [folder_id, ...subfolderIds];

        const fileResult = await client.query(`
            SELECT google_file_id 
            FROM Files 
            WHERE folder_id = ANY($1);
        `, [allFolderIds]);

        const fileIds = fileResult.rows.map(row => row.google_file_id);

        if (fileIds.length > 0) {
            // work on this
            await deleteFilesFromDrive(fileIds);
        }

        await client.query(`
            DELETE FROM Files 
            WHERE folder_id = ANY($1);
        `, [allFolderIds]);

        await client.query(`
            DELETE FROM Folders WHERE folder_id = ANY($1);
        `, [allFolderIds]);

        await client.query('COMMIT');
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error during folder deletion:', error);
        throw error;
    }

}

const queryFilesByParent = async ({repo_id, folder_id}, user_id) => {

    let files;
    if(folder_id){
        files = await query(`
            SELECT f.* FROM Files f
            JOIN Repos r ON f.repo_id = r.id
            JOIN Users u ON r.user_id = u.id
            WHERE f.repo_id = $1 AND f.folder_id = $2 AND (r.visibility = 'public' OR r.user_id = $3);
        `, [repo_id, folder_id, user_id]);
    }
    else{
        files = await query(`
            SELECT f.* FROM Files f
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
        SELECT f.* FROM Files f
        JOIN Repos r ON f.repo_id = r.id
        JOIN Users u ON r.user_id = u.id
        WHERE f.id = $1 AND (r.visibility = 'public' OR r.user_id = $2)
    `, [id, user_id]);

    return file.rows[0];

}

const queryFileByIDAndUser = async (id, user_id) => {

    const file = await query(`
        SELECT f.* FROM Files f
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
    queryFileByIDAndUser,
    queryFilesByFolder
}