const {query} = require('../database/psqlWrapper');
const jwt = require('jsonwebtoken');

const requireAuth = async (req, res, next) => {

    const { user } = req.cookies;

    if(!user){
        return res.status(401).send("Authorization token required.");
    }

    const token = user.jwt;

    if(!token){
        return res.status(401).send("Authorization token required.");
    }

    const {id} = jwt.verify(token, process.env.JWT_SECRET);

    const match = await query(`
            SELECT * FROM Users
            WHERE id = ($1)
        `, [id]);
    
    if(match.rows.length == 0){
        return res.status(401).send("Invalid token.");
    }

    req.user = match.rows[0];
    
    console.log(req.user.name, "has been authorized.");
    next();
}

module.exports = requireAuth;