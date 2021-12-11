package com.ryangwaite.loader

import org.junit.jupiter.api.Test
import kotlin.test.assertEquals

class QuizLoaderTest {

    @Test
    fun `test load from disk`() {
        QuizLoader.init("src/test/resources")
        val questionsAndAnswers = QuizLoader.load("questionsAndAnswers")
        assertEquals(2, questionsAndAnswers.size)
    }
}