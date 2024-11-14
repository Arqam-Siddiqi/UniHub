const mapQuery = require('../database/mapQuery');

const getFullMap = async (req, res) => {

    try{
        const map = await mapQuery.queryMap();

        res.status(200).send(map);
    }
    catch(error){
        res.status(400).send({"Error": error.message});
    }

}

module.exports = {
    getFullMap
}