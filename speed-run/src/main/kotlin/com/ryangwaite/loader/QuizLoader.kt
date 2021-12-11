package com.ryangwaite.loader

import com.ryangwaite.models.QuestionAndAnswers
import kotlinx.coroutines.GlobalScope
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import kotlinx.serialization.Serializable
import kotlinx.serialization.decodeFromString
import kotlinx.serialization.json.Json
import java.io.File
import java.io.FileNotFoundException
import java.util.Date
import java.util.concurrent.ConcurrentHashMap

//@Serializable
//data class QuizFileFormat(
//    val questionsAndAnswers: List<QuestionAndAnswers>,
//)

data class CacheEntry(
    val questionsAndAnswers: List<QuestionAndAnswers>,
    val expiryTime: Date
)

/**
 * Note this is a singleton so we dont risk
 * multiple cachePurgerJobs being kicked off on the global scope
 * across the application
 */
object QuizLoader : IQuizLoader {

    private val cache = ConcurrentHashMap<String, CacheEntry>()

    lateinit var quizDirectoryPath: String
    lateinit var cachePurgerJob: Job

    fun init(quizDirectoryPath: String) {
        this.quizDirectoryPath = quizDirectoryPath
        cachePurgerJob = GlobalScope.launch {
            while (true) {
                delay(60_000) // = 1min
                purgeCache()
            }
        }
    }

    private fun purgeCache() {
        val quizzesForRemoval = mutableListOf<String>()
        val currentTime = Date()
        cache.forEach { (quizId: String, cacheEntry) ->
            if (cacheEntry.expiryTime.before(currentTime)) {
                quizzesForRemoval.add(quizId)
            }
        }
        quizzesForRemoval.forEach { quizId ->
            cache.remove(quizId)
        }
    }

    override fun load(quizId: String): List<QuestionAndAnswers> {
        // Try get from cache
        val cacheEntry = cache.get(quizId)
        if (cacheEntry != null) {
            // Cache hit
            return cacheEntry.questionsAndAnswers
        }

        // Cache miss - populate the cache before returning
        val questionAndAnswers = loadFromDisk(quizId)
        val expiryTime = calculateExpiry(questionAndAnswers)
        val newCacheEntry = CacheEntry(questionAndAnswers, expiryTime)
        cache[quizId] = newCacheEntry

        return questionAndAnswers
    }

    /**
     * Loads file from disk with minimal validation. Full validation is performed by
     * question-set-loader lambda upon upload.
     */
    private fun loadFromDisk(quizId: String): List<QuestionAndAnswers> {
//        val quizFile = File(this.quizDirectoryPath,"$quizId.json")
        // TODO: Replace with proper reference to file once question-set-loader is built
        val quizFile = File(this.quizDirectoryPath,"example-1.json")
        if (!quizFile.exists()) {
            throw FileNotFoundException("File not found for quiz '$quizId' at path '${quizFile.path}'")
        }
        val contents = quizFile.readText()
        return Json.decodeFromString(contents)
    }

    /**
     * Dynamically determine the expiry of the quiz
     */
    private fun calculateExpiry(qAndA: List<QuestionAndAnswers>): Date {
        val lifetimeMilliSeconds = qAndA.size * 60 * 1000
        return Date(Date().time + lifetimeMilliSeconds)
    }
}