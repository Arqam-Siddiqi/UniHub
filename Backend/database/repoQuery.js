const {query} = require('./psqlWrapper');

const queryAllRepos = async () => {

    const repos = await query(`
        SELECT *,
        COALESCE ((
            SELECT COUNT(*) FROM Likes l
            GROUP BY l.repo_id 
            HAVING l.repo_id = r.id
        ), 0) AS "likes" ,
        COALESCE ((
            SELECT COUNT(*) FROM Comments c
            GROUP BY c.repo_id
            HAVING c.repo_id = r.id
        ), 0) AS "num_of_comments"
        FROM Repos r 
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
        SELECT *,
        COALESCE ((
            SELECT COUNT(*) FROM Likes l
            GROUP BY l.repo_id 
            HAVING l.repo_id = r.id
        ), 0) AS "likes" ,
        COALESCE ((
            SELECT COUNT(*) FROM Comments c
            GROUP BY c.repo_id
            HAVING c.repo_id = r.id
        ), 0) AS "num_of_comments",
        EXISTS (
            SELECT * FROM Likes l
            WHERE l.repo_id = r.id AND l.user_id = $1
        ) AS "liked"
        FROM Repos r
        WHERE r.user_id = $1;
    `, [user_id]);

    return repos.rows;
}

const queryReposByID = async (user_id, repo_id) => {
    
    const repo = await query(`
        SELECT *,
        COALESCE ((
            SELECT COUNT(*) FROM Likes l
            GROUP BY l.repo_id 
            HAVING l.repo_id = r.id
        ), 0) AS "likes" ,
        COALESCE ((
            SELECT COUNT(*) FROM Comments c
            GROUP BY c.repo_id
            HAVING c.repo_id = r.id
        ), 0) AS "num_of_comments",
        EXISTS (
            SELECT * FROM Likes l
            WHERE l.repo_id = r.id AND l.user_id = $2
        ) AS "liked"
        FROM Repos r
        WHERE (visibility='public' OR user_id = $2) AND r.id = $1;
    `,[repo_id, user_id]);

    return repo.rows[0];

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

// Can be improved??
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

const toggleLike = async (user_id, repo_id) => {

    await query(`
        WITH toggle AS (
            DELETE FROM Likes
            WHERE user_id = $1 AND repo_id = $2
            RETURNING *
        )
        INSERT INTO Likes (user_id, repo_id)
        SELECT $1, $2
        WHERE NOT EXISTS (SELECT * FROM toggle)
        RETURNING TRUE AS liked;
    `, [user_id, repo_id]);

    const repo = await queryReposByID(user_id, repo_id);

    return repo;

}

module.exports = {
    queryAllRepos,
    createRepo,
    queryAllReposOfUser,
    queryRepoNameOfUser,
    updateRepoOfUser,
    deleteRepoOfUser,
    doesUserOwnRepo,
    queryReposByID,
    toggleLike
}
