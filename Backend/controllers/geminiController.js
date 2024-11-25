const { load } = require('@pspdfkit/nodejs');
const { download } = require('../cloud_storage/cloud');
const { validateQuizParams, initializeGemini, uploadFileBuffer, generateContent, parseQuiz, convertDocxBufferToPdf } = require("../utils/geminiUtils");

const createQuiz = async (req, res) => {

    try{
        const validated_params = validateQuizParams(req.body);
        
        const {model, fileManager} = initializeGemini();
        let text;
        let count = 1;
        
        // console.log(req.file);
        const fileBuffer = await download(req.file);
        // const uploadResponse = await convertDocxBufferToPdf(fileBuffer, fileManager);
        
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
        const {model, fileManager} = initializeGemini(5000);
        let text;
        let count = 1;
        
        const fileBuffer = await download(req.file);
        const uploadResponse = await uploadFileBuffer(fileBuffer, fileManager);

        do {
            text = await generateContent(model, uploadResponse, 'notes');

            count += 1;

            if(count > 2 && !text){  // try twice
                await fileManager.deleteFile(uploadResponse.file.name);
                throw Error("Gemini was unable to parse the content into JSON.");
            }

        } while(!text);
        
        await fileManager.deleteFile(uploadResponse.file.name);

        const formatted_text = {};
        formatted_text.notes = text.notes.replace(/(?<!")\\n(?!")/g, '\n');
        console.log(formatted_text.notes);

        res.status(200).send(formatted_text);
    }
    catch(error){
        res.status(400).send({Error: error.message});
    }

}

module.exports = {
    createQuiz,
    createNotes
}