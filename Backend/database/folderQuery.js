const {query} = require('./psqlWrapper');

const queryAllFolders = async () => {
    const folders = await query(
        `SELECT * FROM folders`
    );
    console.log(folders.rows);
    return folders.rows;
}

const queryFoldersByRepo = async(id)=>{
    const folders= await query(
        `SELECT * FROM folders
        WHERE repo_id = $1`
         ,[id]
    );
    return folders.rows;
}

const queryFoldersByParent = async({repo_id, parent_id})=>{
    
    let folders;

    if(!parent_id){
        folders = await query(`
            SELECT * FROM folders
            WHERE repo_id = $1 AND parent_id IS NULL;
        `, [repo_id]
        );
    }
    else{
        folders = await query(`
            SELECT * FROM folders
            WHERE repo_id = $1 AND parent_id = $2;
        `, [repo_id, parent_id]
        );
    }
    
    return folders.rows;
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
    const folders = await query(
        `UPDATE folders
        SET name = COALESCE($2, name),
            parent_id = $3,
        WHERE id = $1
        RETURNING *;
        `, [id, name, parent_id]
    );
    
    return folders.rows[0];
}
module.exports={
    queryAllFolders,
    queryFoldersByRepo,
    queryFoldersByParent,
    createFolder
}