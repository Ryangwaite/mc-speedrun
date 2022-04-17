package com.ryangwaite.utilities

import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.assertThrows
import kotlin.test.Test
import kotlin.test.assertFalse
import kotlin.test.assertTrue

class TestRepository {

    lateinit var memoryRepository: MemoryRepository

    @BeforeEach
    fun setupEach() {
        memoryRepository = MemoryRepository()
    }

    @Test
    fun `MemoryRepository quiz doesn't exist`() {
        assertFalse { memoryRepository.quizExists("idontexist") }
    }

    @Test
    fun `MemoryRepository quiz does exist after creation`() {
        val quizId = "quizexists"
        memoryRepository.createQuiz(quizId)
        assertTrue { memoryRepository.quizExists(quizId) }
    }

    @Test
    fun `MemoryRepository cant create since quiz already exists`() {
        val quizId = "quizexists"
        memoryRepository.createQuiz(quizId)
        assertThrows<IllegalArgumentException> { memoryRepository.createQuiz(quizId) }
    }

    @Test
    fun `MemoryRepository delete quiz`() {
        val quizId = "quizexists"
        memoryRepository.createQuiz(quizId)
        memoryRepository.deleteQuiz(quizId)
        assertFalse { memoryRepository.quizExists(quizId) }
    }

    @Test
    fun `MemoryRepository delete quiz when quiz doesn't exist`() {
        val quizId = "quizexists"
        assertThrows<IllegalArgumentException> { memoryRepository.deleteQuiz(quizId) }
    }
}
