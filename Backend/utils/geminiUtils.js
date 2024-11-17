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
            {
                "1": {
                    "question": "<Enter Question 1 here>",
                    "A": "2",
                    "B": "3",
                    "C": "4",
                    "D": "5",
                    "answer": "<Enter the correct answer of Question 1 here as A, B, C or D>"
                },
                "2": {
                    "question": "<Enter Question 2 here>",
                    "A": "2",
                    "B": "3",
                    "C": "4",
                    "D": "5",
                    "answer": "<Enter the correct answer of Question 2 here as A, B, C or D>"
                }
            }`
        ,
        "subjective": `
            Questions should be generated using the following JSON-style format:
            {
                "1": {
                "question": "<Enter Question 1 here>",
                "answer": "<Enter the correct answer of Question 1 here>"
                },
                "2": {
                "question": "<Enter Question 2 here>",
                "answer": "<Enter the correct answer of Question 2 here>"
                }
            }
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

module.exports = {
    validateQuizParams,
    quizTextPrompt
}