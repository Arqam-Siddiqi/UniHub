const { validateUserParamsForPatch } = require('../utils/userUtils');
const {query} = require('./psqlWrapper');

const queryAllUsers = async () => {

    const users = await query('SELECT * FROM Users;');

    return users.rows;

}

const queryUserByID = async (id) => {

    const user = await query(
        `SELECT * FROM Users
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

const updateUserByID = async (id, body) => {

    const validated_params = await validateUserParamsForPatch(body);

    const existing_user = await queryUserByID(id);
    let updated_user;


    if(existing_user.google_id){    // For google users
        updated_user = await query(`
            UPDATE Users
            SET name = $1
            WHERE id = $2
            RETURNING *;
        `, [validated_params.name ? validated_params.name : existing_user.name, id]);
    }
    else{
        updated_user = await query(`
            UPDATE Users
            SET name = $1, password = $3
            WHERE id = $2
            RETURNING *;
        `, [validated_params.name ? validated_params.name : existing_user.name, id, validated_params.password ? validated_params.password : existing_user.password]);
    }

    return updated_user.rows[0];
}

module.exports = {
    queryAllUsers,
    queryUserByID,
    queryUserByEmail,
    updateUserByID
}