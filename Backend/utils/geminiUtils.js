const { GoogleGenerativeAI } = require("@google/generative-ai");
const { GoogleAIFileManager } = require("@google/generative-ai/server");

const fs = require('fs');
const tmp = require('tmp');

const initializeGemini = (maxOutputTokens) => {

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_KEY);
    const fileManager = new GoogleAIFileManager(process.env.GEMINI_KEY);

    const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash",
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
    
    let result;
    try{
        result = await model.generateContent([
            {
                fileData: {
                    mimeType: uploadResponse.file.mimeType,
                    fileUri: uploadResponse.file.uri,
                }
            },
            { 
                text: type.toLowerCase() === 'quiz' ? quizTextPrompt(validated_params) : notesTextPrompt()
            },
        ]);
    }
    catch(error){
        console.log(error.message);
        throw Error("Gemini is currently unavailable for use.");
    }
    

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

    if(num_of_questions > 25){
        throw Error("You cannot ask for more than 25 questions.");
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
    
    return `
        Create concise and comprehensive notes from the following document. 
        The content can include both general educational and code-related material. 
        Ensure the notes summarize key concepts and highlight important code snippets. 
        Scan the document for code. If there is code present, then annotate it.
        Make sure all KEYWORDS, such as important terms, functions, or technical jargon, are mentioned in the notes you create. 
        Focus on the most relevant points for university students, including: code structure, functions, and algorithms, while avoiding unnecessary details.
        Your notes should be as detailed as possible.

        Here is an example of how to anotate code (if it is present in the document):
        Document Contents:
        def insertion_sort(arr):
            for i in range(1, len(arr)):
                key = arr[i]
                j = i - 1
                while j >= 0 and key < arr[j]:
                    arr[j + 1] = arr[j]
                    j -= 1
                arr[j + 1] = key
        If there is no code, then ignore the above example.

        Your/Gemini annotation:
        def insertion_sort(arr):
        # Iterate through each element in the list starting from index 1
        for i in range(1, len(arr)):
            key = arr[i]  # The current element to be inserted into the sorted portion of the list
            j = i - 1  # Index of the last element of the sorted portion of the list
            
            # Move elements of arr[0..i-1] that are greater than key to one position ahead of their current position
            while j >= 0 and key < arr[j]:
                arr[j + 1] = arr[j]  # Shift element to the right
                j -= 1  # Move to the next element to the left
            
            # Place the key in its correct position in the sorted portion
            arr[j + 1] = key

        Finally make sure your only output a JSON object with a key \"notes\" and a string value which contains all the notes.
    `;

}

module.exports = {
    validateQuizParams,
    initializeGemini,
    uploadFileBuffer,
    generateContent,
    parseQuiz
}
