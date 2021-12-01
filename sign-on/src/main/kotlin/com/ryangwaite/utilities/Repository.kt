package com.ryangwaite.utilities

interface IRepository {
    fun quizExists(id: String): Boolean
    fun createQuiz(id: String)
    fun deleteQuiz(id: String)
}

/**
 * A simple repository that stores quizzes in memory
 * of this process.
 */
class MemoryRepository(): IRepository {
    val quizzes: HashMap<String, String> = HashMap()

    override fun quizExists(id: String): Boolean = quizzes.containsKey(id)

    override fun createQuiz(id: String) {
        if (quizExists(id)) {
            throw IllegalArgumentException("A quiz with the id '$id' already exists")
        }
        quizzes[id] = "PLACEHOLDER QUIZ METADATA"
    }

    override fun deleteQuiz(id: String) {
        if (!quizExists(id)) {
            throw IllegalArgumentException("No quiz with id '$id' could be found")
        }
        quizzes.remove(id)
    }
}