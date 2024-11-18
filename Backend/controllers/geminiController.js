const {download} = require('../cloud_storage/cloud');

const { validateQuizParams, initializeGemini, uploadFileBuffer, generateContent, parseQuiz } = require("../utils/geminiUtils");

const createQuiz = async (req, res) => {

    try{
        const validated_params = validateQuizParams(req.body);
        
        const {model, fileManager} = initializeGemini();
        let text;
        let count = 1;
        
        const fileBuffer = await download(req.file);
        const uploadResponse = await uploadFileBuffer(fileBuffer, fileManager);
        
        do {
            text = await generateContent(model, uploadResponse, 'quiz', validated_params);
            
            count += 1;

            if(count > 2 && !text){  // try twice
                await fileManager.deleteFile(uploadResponse.file.name);
                throw Error("Gemini was unable to parse the content into JSON.");
            }

        } while(!text);
        
        await fileManager.deleteFile(uploadResponse.file.name);

        const parsed_text = parseQuiz(text);

        res.status(200).send(parsed_text);
    }
    catch(error){
        res.status(400).send({Error: error.message});
    }


}


const createNotes = async (req, res) => {

    try{
        const {model, fileManager} = initializeGemini();
        let text;
        let count = 1;
        
        const fileBuffer = await download(req.file);
        const uploadResponse = await uploadFileBuffer(fileBuffer, fileManager);

        do {
            text = await generateContent(model, uploadResponse, 'notes');

            count += 1;

            if(count > 2){  // try twice
                await fileManager.deleteFile(uploadResponse.file.name);
                throw Error("Gemini was unable to parse the content into JSON.");
            }

        } while(!text);
        
        await fileManager.deleteFile(uploadResponse.file.name);

        res.status(200).send(text);
    }
    catch(error){
        res.status(400).send({Error: error.message});
    }

}

module.exports = {
    createQuiz,
    createNotes
}