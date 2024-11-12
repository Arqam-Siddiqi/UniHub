const {query} = require('./psqlWrapper');

const queryAllRepos = async () => {

    const repos = await query(`
        SELECT * FROM Repos;   
    `);
    
    return repos.rows;

}

const createRepo = async (user_id, {name,  description, visibility} ) => {

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

const queryReposByID = async (user_id, id) => {
    
    const repos = await query(`
        SELECT * FROM Repos
        WHERE (visibility='public' OR user_id = $1) AND id = $2;
    `, [user_id, id]);

    return repos.rows[0];

}


const queryRepoNameOfUser = async (id)=>{

    const repos = await query(`
        SELECT name FROM Repos
        WHERE id = $1   
    `, [id]);

    return repos.rows;
}

const updateRepoOfUser = async ({id, name, description, visibility})=>{

    const repos= await query(`
        UPDATE Repos
        SET name = COALESCE($2, name),
            description = COALESCE($3, description),
            visibility = COALESCE($4, visibility)
        WHERE id = $1
        RETURNING *;
    `, [id, name, description, visibility]);
    
    return repos.rows[0];
}

const deleteRepoOfUser = async ( {id} )=>{
    
    const repos = await query(`
        DELETE FROM Repos
        WHERE id = $1
        RETURNING *;
    `, [id]);

    return repos.rows[0];
}

const doesUserOwnRepo = async (user_id, repo_id) => {

    const repos = await query(`
        SELECT * FROM Repos
        WHERE user_id = $1    
    `, [user_id]);

    const repo_ids = repos.rows.map(data => data.id);

    if(repo_ids.includes(repo_id)){
        return true;
    }

    return false;

}

module.exports = {
    queryAllRepos,
    createRepo,
    queryAllReposOfUser,
    queryRepoNameOfUser,
    updateRepoOfUser,
    deleteRepoOfUser,
    doesUserOwnRepo,
    queryReposByID
}
