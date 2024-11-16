const { validateUserParamsForPatch } = require('../utils/userUtils');
const {query} = require('./psqlWrapper');

const queryAllUsers = async () => {

    const users = await query(`
        SELECT id, name, email, created_at FROM Users;
    `);

    return users.rows;

}

const queryUserByID = async (id) => {

    const user = await query(`
        SELECT id, name, email, created_at FROM Users
        WHERE id = $1;`
    , [id]);

    return user.rows[0];

} 


const queryUserByEmail = async (email) => {

    const user = await query(`
        SELECT * FROM Users
        WHERE email = ($1);
    `, [email]);

    return user.rows[0];

}

const updateUserByID = async (id, validated_params) => {

    const existing_user = await queryUserByID(id);
    let updated_user;

    if(existing_user.google_id){    // For google users
        updated_user = await query(`
            UPDATE Users
            SET name = $1
            WHERE id = $2
            RETURNING *;
        `, [validated_params.name ?? existing_user.name, id]);
    }
    else{
        updated_user = await query(`
            UPDATE Users
            SET name = $1, password = $2
            WHERE id = $3
            RETURNING *;
        `, [validated_params.name ?? existing_user.name, validated_params.password ?? existing_user.password, id]);
    }

    return updated_user.rows[0];
}

const deleteUserByID = async (id) => {

    const user = await query(`
        DELETE FROM Users
        WHERE id = $1
        RETURNING *;    
    `, [id]);
    
    return user.rows[0];

}

const queryUserGoogleTokens = async (id) => {

    const token = await query(`
        SELECT access_token, refresh_token FROM Users u
        JOIN Google_Tokens gt ON u.google_id = gt.google_id
        WHERE id = $1; 
    `, [id]);

    return token.rows[0];

}

module.exports = {
    queryAllUsers,
    queryUserByID,
    queryUserByEmail,
    updateUserByID,
    deleteUserByID,
    queryUserGoogleTokens
}