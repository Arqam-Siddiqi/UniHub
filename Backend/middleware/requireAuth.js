const {query} = require('../database/psqlWrapper');
const jwt = require('jsonwebtoken');

const requireAuth = async (req, res, next) => {

    const { authorization } = req.headers;
    
    if(!authorization){
        return res.status(401).send({error: "Authorization token required."});
    }

    const token = authorization.split(' ')[1];

    try{
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
    catch(error){
        res.status(401).send({error: "Request is not authorized."});
    }

}

module.exports = requireAuth;