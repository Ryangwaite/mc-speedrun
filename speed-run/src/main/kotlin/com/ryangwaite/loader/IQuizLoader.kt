package com.ryangwaite.loader

import com.ryangwaite.models.QuestionAndAnswers

interface IQuizLoader {
    fun load(quizId: String): List<QuestionAndAnswers>
}