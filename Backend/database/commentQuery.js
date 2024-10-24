
const {query} = require('./psqlWrapper');

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

const queryByRepo = async(repo_id)=>{
    const comments=await query(
        `SELECT * FROM Comments
        where repo_id=$1`,
        [repo_id]
    );

    return comments.rows;
}

const comment = async(user_id, repo_id, content)=>{
    const comment=await query(`
        INSERT INTO Comments (user_id, repo_id, content)
        VALUES ($1,$2,$3)
        RETURNING *;`,
    [user_id, repo_id, content]);

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
module.exports={
    queryAllComments,
    queryByUser,
    queryByRepo,
    comment,
    update,
    _delete
}