export enum ClientType {
    HOST,
    PARTICIPANT,
    UNKNOWN,
}

export interface ILeaderboardItem {
    userId: string,
    name: string,
    score: number,
}

export interface Answerer {
    userId: string,
    name: string,
}

export interface IHostQuestion {
    question: string,
    options: string[],
    correctOptions: number[],
    correctAnswerers: Answerer[],
    incorrectAnswerers: Answerer[],
    timeExpiredAnswerers: Answerer[],
}

export interface IQuestionAndAnswers {
    readonly question: string,
    readonly category: string,
    readonly options: string[],
    readonly answers: number[],
}