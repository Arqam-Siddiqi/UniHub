const { user } = require('pg/lib/defaults');
const {query} = require('./psqlWrapper');

const queryAllRepos = async () => {

    const repos = await query(`
        SELECT * FROM Repos;   
    `);
    
    return repos.rows;

}

const createRepo = async (user_id,{name,  description, visibility,}) => {

    const repo = await query(`
        INSERT INTO Repos (name, user_id, visibility, description) VALUES
        ($1, $2, $3, $4)
        RETURNING *;
    `, [name, user_id, visibility, description]);
    
    return repo.rows[0];

}

const queryAllReposOfUser = async (user_id) => {

    const repos = await query(`
        SELECT * FROM Repos
        WHERE user_id = $1    
    `, [user_id]);

    return repos.rows;
}

const queryRepoNameOfUser = async (id)=>{
    const repos = await query(`
        SELECT name FROM Repos
        WHERE id = $1   
    `, [id]);

    return repos.rows;
}

const update = async ({id,name, description, visibility})=>{
    const repos= await query(
        `UPDATE Repos
        SET name = COALESCE($2, name),
            description = COALESCE($3, description),
            visibility = COALESCE($4, visibility)
        WHERE id = $1`
        ,[id,name, description, visibility]
    );
    
    return `Repo updated successfully.`;
}

const _delete = async ({id})=>{
    const repos = await query(
        `DELETE FROM Repos
        WHERE id = $1`
        ,[id]
    );
    return `Repo deleted successfully.`;

}

module.exports = {
    queryAllRepos,
    createRepo,
    queryAllReposOfUser,
    queryRepoNameOfUser,
    update,
    _delete
}
