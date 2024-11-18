const { GoogleGenerativeAI } = require("@google/generative-ai");
const { GoogleAIFileManager } = require("@google/generative-ai/server");

const {download} = require('../cloud_storage/cloud');

const fs = require('fs');
const tmp = require('tmp');
const { validateQuizParams, quizTextPrompt, initializeGemini } = require("../utils/geminiUtils");

const createQuiz = async (req, res) => {

    try{
        const validated_params = validateQuizParams(req.body);

        const {model, fileManager} = initializeGemini(200 * validated_params.num_of_questions);

        const fileBuffer = await download(req.file);

        const tempFile = tmp.fileSync({ postfix: '.pdf' });
        fs.writeFileSync(tempFile.name, fileBuffer);

        const uploadResponse = await fileManager.uploadFile(tempFile.name, {
            mimeType: "application/pdf",
            displayName: "Gemini 1.5 PDF",
        });

        tempFile.removeCallback();

        const result = await model.generateContent([
        {
            fileData: {
                mimeType: uploadResponse.file.mimeType,
                fileUri: uploadResponse.file.uri,
            }
        },
        { 
            text: quizTextPrompt(validated_params)
        },
        ]);

        await fileManager.deleteFile(uploadResponse.file.name);

        const text = JSON.parse(result.response.text());

        res.status(200).send(text);
    }
    catch(error){
        res.status(400).send({"Error": error.message});
    }

}


const createNotes = async (req, res) => {

    try{
        const {model, fileManager} = initializeGemini();

        

        res.status(200).send(model);
    }
    catch(error){
        res.status(400).send({Error: error.message});
    }

}

module.exports = {
    createQuiz
}