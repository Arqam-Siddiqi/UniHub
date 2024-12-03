const {query} = require('./psqlWrapper');

const createGoogleUser = async (profile, access_token, refresh_token) => {

    let user = null;
    try{
        await query('BEGIN');

        await query(`
            INSERT INTO Google_Tokens (google_id, access_token, refresh_token)
            VALUES ($1, $2, $3)
        `, [profile.id, access_token, refresh_token]);
        
        user = await query(`
            INSERT INTO Users (google_id, name, email)
            VALUES ($1, $2, $3)
            ON CONFLICT (email) DO NOTHING
            RETURNING *;`
        , [profile.id, profile.displayName, profile.emails[0].value]);

        await query('COMMIT');
    }
    catch(error){
        await query('ROLLBACK');
        throw error;
    }

    return user.rows[0];

}

const updateGoogleTokens = async (google_id, access_token, refresh_token) => {

    const google_token = await query(`
        UPDATE Google_Tokens
        SET access_token = $2, refresh_token = $3
        WHERE google_id = $1
        RETURNING *;
    `, [google_id, access_token, refresh_token]);

    return google_token.rows[0];

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
    createLocalUser,
    updateGoogleTokens
}