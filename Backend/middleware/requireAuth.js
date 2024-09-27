const {query} = require('../database/psqlWrapper');
const jwt = require('jsonwebtoken');

const requireAuth = async (req, res, next) => {

    const { authorization } = req.headers;

    if(!authorization){
        return res.status(401).send("Authorization token required.");
    }

    const token = authorization.split(' ')[1];

    const {id} = jwt.verify(token, process.env.JWT_SECRET);

    const user = await query(`
            SELECT * FROM Users
            WHERE id = ($1)
        `, [id]);
    
    if(user.rows.length == 0){
        return res.status(401).send("Invalid token.");
    }

    req.user = user.rows[0];
    
    console.log(req.user.name, "has been authorized.");
    next();
}

module.exports = requireAuth;