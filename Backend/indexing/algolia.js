const repo_index = 'repo_index';
const faculty_index = 'faculty_index';

const { algoliasearch } = require('algoliasearch');

const client = algoliasearch(
    process.env.ALGOLIA_APPLICATION_ID,
    process.env.ALGOLIA_ADMIN_API_KEY
);

const insertIntoAlgolia = async (data) => {

    const repo = {
        objectID: data.id,
        name: data.name,
        description: data.description,
        tags: data.tags || [],
        likes: Number(data.likes),
        numOfComments: Number(data.num_of_comments),
        user_id: data.user_id
    };
    
    await client.saveObject({
        indexName: "repo_index",
        body: repo
    });

}

const deleteFromAlgolia = async (id) => {

    await client.deleteObject({ 
        indexName: 'repo_index', 
        objectID: id
    });

}

const getAllReposFromAlgolia = async (search) => {
    const repos = await client.searchSingleIndex({
        indexName: repo_index,
        searchParams: {query: search}
    })

    return repos.hits;
}

module.exports = {
    repo_index,
    faculty_index,
    insertIntoAlgolia,
    deleteFromAlgolia,
    getAllReposFromAlgolia
}