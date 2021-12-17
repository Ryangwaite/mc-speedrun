package com.ryangwaite.score

import org.junit.jupiter.api.Test
import kotlin.test.assertEquals

class ScoreTest {

    @Test
    fun `test no answers correct`() {
        val correctAnswerIndexes = listOf(2, 3)
        val participantAnswerIndexes = listOf(0, 1)
        val maxTimeToAnswer = 1000
        val participantTimeToAnswer = 50
        val actualScore = calculateAnswerScore(correctAnswerIndexes, participantAnswerIndexes, maxTimeToAnswer, participantTimeToAnswer)
        assertEquals(0, actualScore)
    }

    @Test
    fun `test 1 of 2 answers correct`() {
        val correctAnswerIndexes = listOf(1, 3)
        val participantAnswerIndexes = listOf(0, 1)
        val maxTimeToAnswer = 1000
        val participantTimeToAnswer = 0
        val actualScore = calculateAnswerScore(correctAnswerIndexes, participantAnswerIndexes, maxTimeToAnswer, participantTimeToAnswer)
        assertEquals(50, actualScore)
    }

    @Test
    fun `highest scoring answer`() {
        val correctAnswerIndexes = listOf(1, 3)
        val participantAnswerIndexes = listOf(1, 3)
        val maxTimeToAnswer = 1000
        val participantTimeToAnswer = 0
        val actualScore = calculateAnswerScore(correctAnswerIndexes, participantAnswerIndexes, maxTimeToAnswer, participantTimeToAnswer)
        assertEquals(100, actualScore)
    }

    @Test
    fun `all correct time 75percent over`() {
        val correctAnswerIndexes = listOf(1, 3)
        val participantAnswerIndexes = listOf(1, 3)
        val maxTimeToAnswer = 1000
        val participantTimeToAnswer = 750
        val actualScore = calculateAnswerScore(correctAnswerIndexes, participantAnswerIndexes, maxTimeToAnswer, participantTimeToAnswer)
        assertEquals(25, actualScore)
    }

}