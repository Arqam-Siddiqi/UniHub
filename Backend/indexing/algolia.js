const algoliasearch = require('algoliasearch');

const mapQuery = require('../database/mapQuery');

const client = algoliasearch(
    process.env.ALGOLIA_APPLICATION_ID,
    process.env.ALGOLIA_ADMIN_API_KEY
);

const repoIndex = client.initIndex('repo_index');
const facultyIndex = client.initIndex('faculty_index');
const roomIndex = client.initIndex('room_index');

repoIndex.setSettings({
    searchableAttributes: [
        'tags',
        'name',
        'description'
    ]
});

facultyIndex.setSettings({
    searchableAttributes: ['name']
});

roomIndex.setSettings({
    searchableAttributes: ['name']
});

const createOrUpdateRepo = async (data) => {

    const repo = {
        objectID: data.id,
        name: data.name,
        description: data.description,
        tags: data.tags || [],
        likes: Number(data.likes),
        numOfComments: Number(data.num_of_comments),
        user_id: data.user_id,
        user_name: data.user_name
    };
    
    await repoIndex.saveObject(repo);

}

const deleteRepo = async (id) => {

    await repoIndex.deleteObject(id);

}

const getAllPublicRepos = async (search) => {
    const allRepos = [];
    const browse = repoIndex.browseObjects({
        query: '',
        batch: (batch) => {
            allRepos.push(...batch);
        },
    });

    await browse;

    return allRepos;
}

const getAllFaculty = async () => {

    const allFaculty = [];
    const browse = facultyIndex.browseObjects({
        query: '',
        batch: (batch) => {
            allFaculty.push(...batch);
        },
    });

    await browse;

    return allFaculty;
}

const insertAllFaculty = async () => {

    // await facultyIndex.clearObjects().wait();
    // await repoIndex.clearObjects().wait();
    // await roomIndex.clearObjects().wait();

    const test = await getAllFaculty();
    
    if(test.length > 0){
        return;
    }

    console.log("Reinitializing Faculty...");

    const faculty = await mapQuery.queryAllFaculty();

    await facultyIndex.saveObjects(faculty, {
        autoGenerateObjectIDIfNotExist: true
    }).wait();

}

const getAllRooms = async () => {

    const allRooms = [];
    const browse = roomIndex.browseObjects({
        query: '',
        batch: (batch) => {
            allRooms.push(...batch);
        },
    });

    await browse;

    return allRooms;
}

const insertAllRooms = async () => {

    const test = await getAllRooms();

    if(test.length > 0){
        return;
    }

    console.log("Reinitializing Rooms...");

    const rooms = await mapQuery.queryAllRooms();

    await roomIndex.saveObjects(rooms, {
        autoGenerateObjectIDIfNotExist: true
    }).wait();

}

module.exports = {
    createOrUpdateRepo,
    deleteRepo,
    getAllPublicRepos,
    getAllFaculty,
    insertAllFaculty,
    insertAllRooms
}