const userQuery = require('../database/userQuery');
const jwt = require('jsonwebtoken');

const requireAuth = async (req, res, next) => {

    const { authorization } = req.headers;
    
    if(!authorization){
        return res.status(401).send({Error: "Authorization token required."});
    }

    const token = authorization.split(' ')[1];

    try{
        const {id} = jwt.verify(token, process.env.JWT_SECRET);

        const match = await userQuery.queryUserByID(id);
        
        if(!match){
            return res.status(401).send("Invalid token.");
        }

        req.user = match.id;
        
        console.log(match.name, "has been authorized.");
        next();
    }
    catch(error){
        res.status(401).send({Error: "Request is not authorized."});
    }

}

module.exports = requireAuth;