const {query} = require('./psqlWrapper');

const createGoogleUser = async (profile) => {

    const user = await query(
        `INSERT INTO Users (google_id, name, email)
        VALUES ($1, $2, $3)
        ON CONFLICT (email) DO NOTHING
        RETURNING *;`
    , [profile.id, profile.displayName, profile.emails[0].value]);

    return user.rows[0];

}

const createLocalUser = async (name, password, email) => {

    const user = await query(`
        INSERT INTO Users(name, password, email)
        VALUES ($1, $2, $3)
        RETURNING *; 
    `, [name, password, email]);

    return user.rows[0];

}

module.exports = {
    createGoogleUser,
    createLocalUser
}