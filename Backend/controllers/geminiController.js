const { downloadFileAsPDF, deleteFile } = require('../cloud_storage/drive');
const { validateQuizParams, initializeGemini, uploadFileBuffer, generateContent, parseQuiz } = require("../utils/geminiUtils");

const createQuiz = async (req, res) => {

    try{
        const t1 = performance.now();

        const validated_params = validateQuizParams(req.body);
        
        const {model, fileManager} = initializeGemini();
        let text;
        let count = 1;

        const {google_file_id} = req.file;

        const {fileBuffer, google_doc_id} = await downloadFileAsPDF(google_file_id);
        const uploadResponse = await uploadFileBuffer(fileBuffer, fileManager);
        await deleteFile(google_doc_id);

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
        
        const t2 = performance.now();
        console.log("Time taken to create Quiz: ", t2 - t1);

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

        const {google_file_id} = req.file;

        const {fileBuffer, google_doc_id} = await downloadFileAsPDF(google_file_id);
        const uploadResponse = await uploadFileBuffer(fileBuffer, fileManager);
        await deleteFile(google_doc_id);

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
        // console.log(formatted_text.notes);

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