const {query} = require('./psqlWrapper');
const queryAllFolders = async ()=>{
    const folders=await query(
        `SELECT * FROM folders`
    );
    console.log(folders.rows);
    return folders.rows;
}

const getFoldersByRepo = async(id)=>{
    const folders= await query(
        `SELECT * FROM folders
        WHERE repo_id = $1`
         ,[id]
    );
    console.log(folders.rows);
    return folders.rows;
} 

// const createRootFolder = async (name,  repo_id)=>{
//     const folder= await query(
//         `INSERT INTO folders (name,  repo_id)
//          VALUES ($1,$2)
//          RETURNING *;`
//          ,[name ,repo_id]
//     );
//     console.log(folder.rows[0]);
//     return folder.rows[0];
// }

const createFolder = async({name, parent_id,repo_id})=>{
    if(parent_id===undefined){
        parent_id=null;
    }
    console.log('Received:', { name, parent_id, repo_id });

    const folder= await query(
        `INSERT INTO folders (name, parent_id, repo_id)
         VALUES ($1,$2,$3)
         RETURNING *;`
         ,[name, parent_id ,repo_id]
    );
    console.log(folder.rows[0]);
    return folder.rows[0];
}

const updateFolder = async ({id,name, parent_id})=>{
    const repos= await query(
        `UPDATE folders
        SET name = COALESCE($2, name),
            parent_id = $3,
        WHERE id = $1`
        ,[id,name, parent_id]
    );
    
    return `Folder updated successfully.`;
}
module.exports={
    queryAllFolders,
    getFoldersByRepo,
    createFolder
}