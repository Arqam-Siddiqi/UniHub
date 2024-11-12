const {query} = require('./psqlWrapper');

const queryByID = async(id) => {

    const comment = await query(`
        SELECT * FROM Comments
        WHERE id = $1;
    `, [id]);

    return comment.rows[0];
}

const queryAllComments = async ()=>{
    const comments=await query(
        `SELECT * FROM Comments`
    );

    return comments.rows;
}

const queryByUser = async (user_id)=>{
    const comments=await query(
        `SELECT * FROM Comments
        where user_id=$1`,
        [user_id]
    );

    return comments.rows;
}

const queryByRepo = async(repo_id) => {

    const comments=await query(`
        SELECT c.*, u.name AS "username", u.email FROM Comments c 
        JOIN Users u ON c.user_id = u.id
        WHERE repo_id=$1
        ORDER BY c.created_at DESC;
        `, [repo_id]
    );

    return comments.rows;
}

const comment = async(user_id,repo_id, content)=>{
    const comment=await query(`
        INSERT INTO Comments (user_id, repo_id, content)
        VALUES ($1,$2,$3)
        RETURNING *;`,
    [user_id,repo_id, content]);

    return comment.rows[0];
}

const update = async (id, content)=>{
    const comment = await query(
        `UPDATE Comments 
        SET content=$2
        WHERE id= $1
        RETURNING *;`,
        [id, content]
    );

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
