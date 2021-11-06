export const APP_NAME: string = "Multiple Choice Speedrun"


export interface IQuestionAndAnswers {
    readonly question: string,
    readonly category: string,
    readonly options: string[],
    readonly answers: number[],
}

export const SAMPLE_QUESTIONS_AND_ANSWERS: IQuestionAndAnswers[] = [
    {
        question: "What does 'www' stand for in a web browser?",
        category: "technology",
        options: [
            "world wide web",
            "worlds widest website",
            "who what when",
            "i dont know",
        ],
        answers: [0],  // index for the correct answer in 'options'
    },
    {
        question: "Which of these databases are relational?",
        category: "technology",
        options: [
            "DynamoDB",
            "Athena",
            "Redshift",
            "Redis",
        ],
        answers: [2],
    },
    {
        question: "Which of these is not a fiat currency?",
        category: "finance",
        options: [
            "USD",
            "AUD",
            "BTC",
            "CNY",
        ],
        answers: [2],
    },
    {
        question: "Which of these are backend web service frameworks?",
        category: "technology",
        options: [
            "flask",
            "react",
            "ktor",
            "vue",
        ],
        answers: [0, 2],
    },
    {
        question: "Which company had the highest market cap at the end of 2021?",
        category: "finance",
        options: [
            "Telstra",
            "Suncorp",
            "Walmart",
            "Apple",
        ],
        answers: [3],
    },
    {
        question: "Which asset class are generally considered defensive?",
        category: "finance",
        options: [
            "Property",
            "Stock",
            "Bonds",
            "Cash",
        ],
        answers: [2, 3],
    },
    {
        question: "What is the heaviest animal?",
        category: "animals",
        options: [
            "Chicken",
            "Elephant",
            "Rice",
            "Cat",
        ],
        answers: [1],
    },
    {
        question: "Which of the following are macro-nutrients?",
        category: "health",
        options: [
            "Protein",
            "Calcium",
            "Fat",
            "Water",
        ],
        answers: [0, 2],
    },
    {
        question: "How many limbs do dogs have?",
        category: "health",
        options: [
            "1",
            "2",
            "3",
            "4",
        ],
        answers: [3],
    },
    {
        question: "Which exercises train legs?",
        category: "health",
        options: [
            "Squats",
            "Deadlifts",
            "Bench Press",
            "Barbell Rows",
        ],
        answers: [0, 1],
    },
    
]

export interface IParticipant {
    name: string,
    score: number,
    position?: number, // where they are placed relative to others. First place is 1
    selected: boolean, // For rendering purposes
}

export const SAMPLE_PARTICIPANTS: IParticipant[] = [
    {
        name: "ryan",
        score: 65,
        selected: false,
    },
    {
        name: "james",
        score: 1456,
        selected: false,
    },
    {
        name: "chicken",
        score: 45,
        selected: false,
    },
    {
        name: "zombie",
        score: 6,
        selected: false,
    },
    {
        name: "doge",
        score: 998,
        selected: false,
    },
    {
        name: "Bruce",
        score: 564,
        selected: false,
    },
    {
        name: "steve",
        score: 9,
        selected: false,
    },
    {
        name: "sean",
        score: 633,
        selected: false,
    },
    {
        name: "Devon",
        score: 111,
        selected: false,
    },
    {
        name: "Sam",
        score: 1,
        selected: false,
    },
    {
        name: "Apple",
        score: 1000,
        selected: false,
    },
    {
        name: "dragon",
        score: 7,
        selected: false,
    },
    {
        name: "ironman",
        score: 9999,
        selected: false,
    },
    {
        name: "sjdfhs",
        score: 6416,
        selected: false,
    },
]