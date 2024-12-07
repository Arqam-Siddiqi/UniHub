const {query} = require('./psqlWrapper');

const queryAllRepos = async (order_by, limit, user_id) => {

    const repos = await query(`
        SELECT 
            r.*,
            ARRAY_AGG(t.name) FILTER (WHERE t.name IS NOT NULL) AS "tags",
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
        LEFT JOIN Repo_Tags rt ON r.id = rt.repo_id
        LEFT JOIN Tags t ON rt.tag_id = t.id
        WHERE r.visibility='public'
        GROUP BY r.id
        ${order_by ? `ORDER BY ${order_by} DESC` : ''}
        ${limit ? `LIMIT ${limit}` : ''}
        ;
    `, [user_id]);
    
    return repos.rows;

}

const createRepo = async (user_id, {name,  description, visibility, tags} ) => {

    let repo_id = null;
    
    try{
        await query('BEGIN'); 

        const fetch_repo = await query(`
            INSERT INTO Repos (name, user_id, visibility, description) VALUES
            ($1, $2, $3, $4)
            RETURNING *;
        `, [name, user_id, visibility, description]);

        repo_id = fetch_repo.rows[0].id;

        if(tags && tags.length > 0){

            await query(`
                INSERT INTO Tags (name) VALUES
                ${tags.map((_, i) => `($${i+1})`).join(', ')}
                ON CONFLICT (name) DO NOTHING;
            `, tags);
            
            const fetch_tag_ids = await query(`
                SELECT id FROM Tags
                WHERE name = ANY($1::text[])
            `, [tags]);
            
            const tag_ids = fetch_tag_ids.rows.map(element => element.id);
            
            await query(`
                INSERT INTO Repo_Tags (repo_id, tag_id) VALUES
                ${tag_ids.map((_, i) => `($1, $${i+2})`).join(', ')};
            `, [repo_id, ...tag_ids]);
        }

        await query('COMMIT');
    }
    catch(error){
        await query('ROLLBACK');
        
        throw Error(error.message);
    }
    

    const repo = await query(`
        SELECT 
            r.*, 
            ARRAY_AGG(t.name) FILTER (WHERE t.name IS NOT NULL) AS "tags"
        FROM Repos r
        LEFT JOIN Repo_Tags rt ON r.id = rt.repo_id
        LEFT JOIN Tags t ON rt.tag_id = t.id
        WHERE r.id = $1
        GROUP BY r.id;
    `, [repo_id])

    return repo.rows[0];

}

const queryAllReposOfUser = async (user_id) => {

    const repos = await query(`
        SELECT 
            r.*,
            ARRAY_AGG(t.name) FILTER (WHERE t.name IS NOT NULL) AS "tags",
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
        LEFT JOIN Repo_Tags rt ON r.id = rt.repo_id
        LEFT JOIN Tags t ON rt.tag_id = t.id
        WHERE r.user_id = $1
        GROUP BY r.id;
    `, [user_id]);

    return repos.rows;
}

const queryAllPublicReposOfUser = async (user_id) => {

    const repos = await query(`
        SELECT 
            r.*,
            ARRAY_AGG(t.name) FILTER (WHERE t.name IS NOT NULL) AS "tags",
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
        LEFT JOIN Repo_Tags rt ON r.id = rt.repo_id
        LEFT JOIN Tags t ON rt.tag_id = t.id
        WHERE r.user_id = $1 AND r.visibility = 'public'
        GROUP BY r.id;
    `, [user_id]);

    return repos.rows;
}

const queryReposByID = async (user_id, repo_id) => {
    
    const repo = await query(`
        SELECT 
            r.*,
            ARRAY_AGG(t.name) FILTER (WHERE t.name IS NOT NULL) AS "tags",
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
        LEFT JOIN Repo_Tags rt ON r.id = rt.repo_id
        LEFT JOIN Tags t ON rt.tag_id = t.id
        WHERE (visibility='public' OR user_id = $2) AND r.id = $1
        GROUP BY r.id;
    `, [repo_id, user_id]);

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

    const repos = await query(`
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

const toggleLike = async (user_id, repo_id) => {

    await query(`
        CREATE OR REPLACE FUNCTION validate_like_fk()
        RETURNS TRIGGER AS $$
        BEGIN
            -- Check if user_id exists in Users table
            IF NOT EXISTS (SELECT 1 FROM Users WHERE id = NEW.user_id) THEN
                RAISE EXCEPTION 'user_id % does not exist in Users', NEW.user_id;
            END IF;
    
            -- Check if repo_id exists in Repos table
            IF NOT EXISTS (SELECT 1 FROM Repos WHERE id = NEW.repo_id) THEN
                RAISE EXCEPTION 'repo_id % does not exist in Repos', NEW.repo_id;
            END IF;
    
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;

        -- Create the trigger for Likes table if it doesn't exist
        DO $$ BEGIN
            IF NOT EXISTS (
                SELECT 1 
                FROM pg_trigger 
                WHERE tgname = 'validate_like_fk_trigger'
            ) THEN
                CREATE TRIGGER validate_like_fk_trigger
                BEFORE INSERT ON Likes
                FOR EACH ROW
                EXECUTE FUNCTION validate_like_fk();
            END IF;
        END $$;
    `);

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

const searchTitleAndTags = async (search) => {

    const repos = await query(`
        WITH Ranks AS (
            SELECT r.*,
                ARRAY_AGG(t.name) FILTER (WHERE t.name IS NOT NULL) AS "tags", 
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
                MAX(CASE 
                    WHEN r.name ILIKE '%' || $1 || '%' AND t.name ILIKE '%' || $1 || '%' THEN 3
                    WHEN r.name ILIKE '%' || $1 || '%' THEN 2
                    WHEN t.name ILIKE '%' || $1 || '%' THEN 1
                    ELSE 0
                END) AS relevance
            FROM Repos r
            LEFT JOIN Repo_Tags rt ON r.id = rt.repo_id
            LEFT JOIN Tags t ON rt.tag_id = t.id
            WHERE r.visibility='public'
            GROUP BY r.id
        )
        SELECT * FROM Ranks
        WHERE relevance > 0
        ORDER BY relevance DESC, likes DESC, created_at;
    `, [search]);

    return repos.rows;

}

const getUserFromRepo = async (id) => {

    const user = await query(`
        SELECT u.name AS "user_name"
        FROM Repos r
        JOIN Users u ON r.user_id = u.id
        WHERE r.id = $1;
    `, [id]);
    
    return user.rows[0];

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
    toggleLike,
    searchTitleAndTags,
    queryAllPublicReposOfUser,
    getUserFromRepo
}
