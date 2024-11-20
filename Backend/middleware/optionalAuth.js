const userQuery = require('../database/userQuery');
const jwt = require('jsonwebtoken');

const optionalAuth = async (req, res, next) => {

    const { authorization } = req.headers;
    
    if(!authorization){
       return next();
    }

    const token = authorization.split(' ')[1];

    try{
        const {id} = jwt.verify(token, process.env.JWT_SECRET);

        const match = await userQuery.queryUserByID(id);
        
        if(!match){
            return next();
        }

        req.user = match.id;
        
        console.log(match.name, "has been authorized.");
        return next();
    }
    catch(error){
        return next();
    }

}

module.exports = optionalAuth