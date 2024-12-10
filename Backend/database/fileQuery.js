const {query} = require('./psqlWrapper');

const queryFilesFromRepo = async (repo_id, user_id) => {

    const files = await query(`
        SELECT f.* FROM Files f
        JOIN Repos r ON f.repo_id = r.id
        JOIN Users u ON r.user_id = u.id
        WHERE f.repo_id = $1 AND (r.visibility = 'public' OR r.user_id = $2)
        ORDER BY created_at;
    `, [repo_id, user_id]);

    return files.rows;

}

// Used to find all children files of a Folder X.
// This includes children files that belong to a child folder of Folder X
const deleteChildrenOfFolder = async (folder_id, user_id) => {

    // Validate that the folder belongs to a repo owned by the user
    const repoValidationResult = await query(`
        SELECT r.id
        FROM Repos r
        INNER JOIN Folders f ON r.id = f.repo_id
        WHERE f.id = $1 AND r.user_id = $2;
    `, [folder_id, user_id]);

    if (repoValidationResult.rowCount === 0) {
        throw new Error('Unauthorized access or folder not found.');
    }

    const repo_id = repoValidationResult.rows[0].id;

    // Fetch all subfolder IDs recursively for the given folder
    const subfolderResult = await query(`
        WITH RECURSIVE Subfolders AS (
            SELECT id
            FROM Folders
            WHERE id = $1 AND repo_id = $2

            UNION ALL
            
            SELECT f.id
            FROM Folders f
            INNER JOIN Subfolders sf ON f.parent_id = sf.id
            WHERE f.repo_id = $2
        )
        SELECT id FROM Subfolders;
    `, [folder_id, repo_id]);
    
    // Combine the given folder ID and its subfolder IDs
    const allFolderIds = subfolderResult.rows.map(row => row.id);

    // Fetch all google_file_ids for files in these folders
    const fileResult = await query(`
        SELECT google_file_id 
        FROM Files 
        WHERE folder_id = ANY($1) AND repo_id = $2;
    `, [allFolderIds, repo_id]);

    const fileIds = fileResult.rows.map(row => row.google_file_id);
    
    // Delete all folders (Files will be automatically deleted due to CASCADE)
    await query(`
        DELETE FROM Folders 
        WHERE id = ANY($1) AND repo_id = $2 AND id != $3;
    `, [allFolderIds, repo_id, folder_id]);

    // Return the Google file IDs to the caller
    return fileIds;
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
    deleteChildrenOfFolder
}