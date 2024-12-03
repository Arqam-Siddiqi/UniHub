const {query} = require('./psqlWrapper');

const queryAllFolders = async (user_id) => {
    const folders = await query(`
        SELECT f.* FROM folders f
        JOIN Repos r ON f.repo_id = r.id
        WHERE r.visibility = 'public' OR r.user_id = $1
    `, [user_id]);
    
    return folders.rows;
}

const queryFoldersByRepo = async (id, user_id) => {
    const folders = await query(`
        SELECT f.* FROM folders f
        JOIN Repos r ON f.repo_id = r.id
        WHERE repo_id = $1 AND (r.visibility = 'public' OR r.user_id = $2)
    `, [id, user_id]);

    return folders.rows;
}

const queryFoldersByParent = async({repo_id, parent_id}, user_id)=>{
    
    let folders;

    if(!parent_id){
        folders = await query(`
            SELECT f.* FROM folders f
            JOIN Repos r ON f.repo_id = r.id
            WHERE repo_id = $1 AND parent_id IS NULL AND (visibility = 'public' OR r.user_id = $2)
        `, [repo_id, user_id]
        );
    }
    else{
        folders = await query(`
            SELECT f.* FROM folders f
            JOIN Repos r ON f.repo_id = r.id
            WHERE repo_id = $1 AND parent_id = $2 AND (visibility = 'public' OR r.user_id = $3)
        `, [repo_id, parent_id, user_id]
        );
    }
    
    console.log(folders.rows);
    return folders.rows;
} 

const doesRepoOwnFolder = async (repo_id, folder_id) => {

    const folders = await query(`
        SELECT * FROM Folders
        WHERE repo_id = $1    
    `, [repo_id]);

    const folder_ids = folders.rows.map(data => data.id);

    if(folder_ids.includes(folder_id)){
        return true;
    }

    return false;

}

const createFolder = async({name, parent_id, repo_id})=>{
    if(parent_id === undefined){
        parent_id = null;
    }

    const folder= await query(
        `INSERT INTO folders (name, parent_id, repo_id)
         VALUES ($1,$2,$3)
         RETURNING *;`
         ,[name, parent_id ,repo_id]
    );
    
    return folder.rows[0];
}

const updateFolder = async ({id,name, parent_id})=>{
    let folders;
    if(parent_id===undefined){
        folders = await query(
            `UPDATE folders
            SET name = COALESCE($2, name)
            WHERE id = $1
            RETURNING *;
            `, [id, name]
        );
    }
    else{
        folders = await query(
            `UPDATE folders
            SET name = COALESCE($2, name),
                parent_id = $3
            WHERE id = $1
            RETURNING *;
            `, [id, name, parent_id]
        );
    } 
    
    
   
    console.log(folders.rows[0]);
    return folders.rows[0];
}

const getFolder = async (id)=>{
    const folders = await query(
        `SELECT * FROM folders
        WHERE id = $1;
        `, [id]
    );
    
    return folders.rows[0];
}



const deleteFolder = async ({id})=>{
    const folders = await query(`
        DELETE FROM folders
        WHERE id = $1
        RETURNING *;
    `, [id]);

    return folders.rows[0];
}
module.exports={
    queryAllFolders,
    queryFoldersByRepo,
    queryFoldersByParent,
    createFolder,
    doesRepoOwnFolder,
    getFolder,
    deleteFolder,
    updateFolder
}