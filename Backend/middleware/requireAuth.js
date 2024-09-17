const express = require('express');

const requireAuth = (req, res, next) => {

    if(!req.user){
        return res.status(401).send("Authorization token required.");
    }

    console.log(req.user.name, "has been authorized.");
    next();

}

module.exports = requireAuth;