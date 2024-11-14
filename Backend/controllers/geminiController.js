const { GoogleGenerativeAI } = require("@google/generative-ai");
const { GoogleAIFileManager } = require("@google/generative-ai/server");

const {download} = require('../cloud_storage/cloud');

const fs = require('fs');
const tmp = require('tmp');

const createQuiz = async (req, res) => {

    try{
        const fileBuffer = await download(req.file);

        const tempFile = tmp.fileSync({ postfix: '.pdf' });
        fs.writeFileSync(tempFile.name, fileBuffer);

        // Initialize GoogleGenerativeAI with your API_KEY.
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_KEY);
        // Initialize GoogleAIFileManager with your API_KEY.
        const fileManager = new GoogleAIFileManager(process.env.GEMINI_KEY);
        const model = genAI.getGenerativeModel({
            // Choose a Gemini model.
            model: "gemini-1.5-flash",
        });

        // Upload the file and specify a display name.
        const uploadResponse = await fileManager.uploadFile(tempFile.name, {
            mimeType: "application/pdf",
            displayName: "Gemini 1.5 PDF",
        });

        tempFile.removeCallback();

        // Generate content using text and the URI reference for the uploaded file.
        const result = await model.generateContent([
        {
            fileData: {
                mimeType: uploadResponse.file.mimeType,
                fileUri: uploadResponse.file.uri,
            },
        },
        { text: "Can you summarize this document as a bulleted list?" },
        ]);

        await fileManager.deleteFile(uploadResponse.file.name);

        // Output the generated text to the console
        const text = result.response.text().toString();
        res.status(200).send(text);
    }
    catch(error){
        res.status(400).send({"Error": error.message});
    }

}

module.exports = {
    createQuiz
}