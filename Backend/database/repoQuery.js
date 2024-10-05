const {query} = require('./psqlWrapper');

const queryAllRepos = async () => {

    const repos = await query(`
        SELECT * FROM Repos;   
    `);

    return repos.rows;

}

const createRepo = async ({name, user_id, visibility, description}) => {

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

module.exports = {
    queryAllRepos,
    createRepo,
    queryAllReposOfUser
}
