const { GoogleGenerativeAI } = require("@google/generative-ai");
const { GoogleAIFileManager } = require("@google/generative-ai/server");

const fs = require('fs');
const tmp = require('tmp');

const initializeGemini = (maxOutputTokens) => {

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_KEY);
    const fileManager = new GoogleAIFileManager(process.env.GEMINI_KEY);

    const model = genAI.getGenerativeModel({
        model: "gemini-1.5-flash",
        generationConfig: {
            temperature: 0.2,
            responseMimeType: 'application/json',
            maxOutputTokens: maxOutputTokens
        }
    });

    return {
        model,
        fileManager
    };

}

const uploadFileBuffer = async (fileBuffer, fileManager) => {
    
    const tempFile = tmp.fileSync({ postfix: '.pdf' });
    fs.writeFileSync(tempFile.name, fileBuffer);

    const uploadResponse = await fileManager.uploadFile(tempFile.name, {
        mimeType: "application/pdf",
        displayName: "Gemini 1.5 PDF",
    });

    tempFile.removeCallback();

    return uploadResponse;
}

const generateContent = async (model, uploadResponse, type, validated_params) => {
    
    const result = await model.generateContent([
        {
            fileData: {
                mimeType: uploadResponse.file.mimeType,
                fileUri: uploadResponse.file.uri,
            }
        },
        { 
            text: type.toLowerCase() === 'quiz' ? quizTextPrompt(validated_params) : ''
        },
    ]);

    try {
        return JSON.parse(result.response.text());
    }
    catch (error) {
        return null;
    }

}

const parseQuiz = (text) => {

    const questions = [];
    const answers = [];

    for(let i = 0; i<text.length; i++){
        answers.push(text[i].answer);
        delete text[i].answer;
        
        questions.push(text[i]);
    }

    return {questions, answers};

}

const validateQuizParams = ({num_of_questions, type_of_questions}) => {

    const allowed_types = ['subjective', 'objective'];

    if(!num_of_questions || !type_of_questions){
        throw Error("Please fill all the required fields.");
    }

    if(!allowed_types.includes(type_of_questions)){
        throw Error("Question types can only be \"subjective\" or \"objective\".");
    }

    return {
        num_of_questions,
        type_of_questions
    }
}

const quizTextPrompt = ({num_of_questions, type_of_questions}) => {

    instructions = {
        "objective": `
            Each question needs to be an MCQ. It will consist of a question, and 4 possible answers (A, B, C, D).
            These 4 possible answers will be called \"options\".

            Make sure each option is used as often as the others.
            For example: if you need to generate 8 MCQs, then one possible arrangement of answers is: C, D, A, D, B, A, C, B.
            
            Avoid using the same option as the correct answer consecutively.
            This is an example of a bad arrangement of answers: D, D, D, B, B, A, A, C, C.
            This is an example of a good arrangement of answers: B, C, A, C, D, B, A, D, B.

            Questions should be generated using the following JSON-style format:
            [
                {
                    "question": "<Enter Question 1 here>",
                    "A": "<Enter a possible answer for Question 1 here>",
                    "B": "<Enter a possible answer for Question 1 here>",
                    "C": "<Enter a possible answer for Question 1 here>",
                    "D": "<Enter a possible answer for Question 1 here>",
                    "answer": "<Enter the correct answer of Question 1 here as A, B, C or D>"
                },
                {
                    "question": "<Enter Question 2 here>",
                    "A": "<Enter a possible answer for Question 2 here>",
                    "B": "<Enter a possible answer for Question 2 here>",
                    "C": "<Enter a possible answer for Question 2 here>",
                    "D": "<Enter a possible answer for Question 2 here>",
                    "answer": "<Enter the correct answer of Question 2 here as A, B, C or D>"
                }
            }`
        ,
        "subjective": `
            Questions should be generated using the following JSON-style format:
            [
                {
                    "question": "<Enter Question 1 here>",
                    "answer": "<Enter the correct answer for Question 1 here>"
                },
                {
                    "question": "<Enter Question 2 here>",
                    "answer": "<Enter the correct answer for Question 2 here>"
                }
            ]
        `
    }

    const prompt = `You need to create quizes based on my requirements.
        Here are the instructions you must follow:
        
        Ignore any blank sections/pages.
        Separate all the sections from each other. Each question must be based on only ONE section. There can be no overlap of TWO sections in one question.
        If there are multiple sections in the document, make sure you generate the questions sequentially.
        For example: if there are 2 sections in the document and you need to generate 10 questions, then first generate 5 questions for the first section and THEN generate 5 questions for the second section.
        Another example: if there are 3 sections in the document and you need to generate 10 questions, then first generate 3 questions for the first section, 4 questions for the second section, and finally 3 questions for the third section.
        Make sure you cover all the sections mentioned in the document.
        
        Do NOT repeat the same question. All questions should be distinct and unique.
                  
        Make sure that there is only one right answer for each question.
        Try to generate questions from the images in the document as well.
        All of the questions should be taken from the document provided by the user.
        Only use questions that can be answered directly from the document.
                  
        `
        + instructions[type_of_questions] + "\n"
        + `Now, generate ${num_of_questions} ${type_of_questions} from the contents of the document I have sent.`;

    return prompt
}

const notesTextPrompt = () => {
    
    

}

module.exports = {
    validateQuizParams,
    quizTextPrompt,
    initializeGemini,
    uploadFileBuffer,
    generateContent,
    parseQuiz
}