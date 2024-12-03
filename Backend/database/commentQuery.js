const {query} = require('./psqlWrapper');

const queryByID = async(id) => {

    const comment = await query(`
        SELECT * FROM Comments
        WHERE id = $1;
    `, [id]);

    return comment.rows[0];
}

const queryAllComments = async ()=>{
    const comments = await query(`
        SELECT * FROM Comments;
    `);

    return comments.rows;
}

const queryByUser = async (user_id)=>{
    const comments = await query(`
        SELECT * FROM Comments
        WHERE user_id = $1;
    `, [user_id]);

    return comments.rows;
}

const queryByRepo = async (repo_id, user_id) => {

    const comments=await query(`
        SELECT c.*, u.name AS "username", u.email FROM Comments c
        JOIN Users u ON c.user_id = u.id
        JOIN Repos r ON c.repo_id = r.id
        WHERE c.repo_id = $1 AND (r.visibility = 'public' OR r.user_id = $2)
        ORDER BY c.created_at DESC;
    `, [repo_id, user_id]);

    return comments.rows;
}

const comment = async (user_id, repo_id, content)=>{

    await query(`
        CREATE OR REPLACE FUNCTION validate_comment_fk()
        RETURNS TRIGGER AS $$
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM Repos WHERE id = NEW.repo_id) THEN
                RAISE EXCEPTION 'repo_id % does not exist in Repos', NEW.repo_id;
            END IF;
    
            IF NOT EXISTS (SELECT 1 FROM Users WHERE id = NEW.user_id) THEN
                RAISE EXCEPTION 'user_id % does not exist in Users', NEW.user_id;
            END IF;
    
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
    
        -- Create the trigger once
        DO $$ BEGIN
          IF NOT EXISTS (
            SELECT 1 
            FROM pg_trigger 
            WHERE tgname = 'check_comment_fk'
          ) THEN
            CREATE TRIGGER check_comment_fk
            BEFORE INSERT ON Comments
            FOR EACH ROW
            EXECUTE FUNCTION validate_comment_fk();
          END IF;
        END $$;
    `);

    const comment = await query(`
        INSERT INTO Comments (user_id, repo_id, content)
        VALUES ($1,$2,$3)
        RETURNING *;
    `, [user_id, repo_id, content]);

    return comment.rows[0];
}

const update = async (id, content)=>{
    const comment = await query(`
        UPDATE Comments 
        SET content=$2
        WHERE id= $1
        RETURNING * ;
    `, [id, content]); 

    return comment.rows[0];
} 

const _delete = async (id)=>{
    const comment = await query(
        `DELETE FROM Comments
        WHERE id=$1
        RETURNING *;`,
        [id]
    )

    return comment.rows[0];
} 

const belongsToUser = async (id, user_id) => {

    const comment = await query(`
        SELECT c.*, u.name AS "username", u.email FROM Comments c 
        JOIN Users u ON c.user_id = u.id
        WHERE c.id = $1 AND c.user_id = $2
    `, [id, user_id]);

    return comment.rows[0];

}

module.exports={
    queryAllComments,
    queryByUser,
    queryByRepo,
    comment,
    update,
    _delete,
    belongsToUser,
    queryByID
}
