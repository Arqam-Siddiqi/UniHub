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

const getFaculty = async (req, res) => {

    try{
        const {room_id} = req.body;
        if(!room_id){
            throw Error("Please send the room_id for the Faculty Room.");
        }

        const faculty = await mapQuery.queryFaculty(room_id);

        res.status(200).send(faculty);
    }
    catch(error){
        res.status(400).send({"Error": error.message});
    }

}

module.exports = {
    getFullMap,
    getFaculty
}