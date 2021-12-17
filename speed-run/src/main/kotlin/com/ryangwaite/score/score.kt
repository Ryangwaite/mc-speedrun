package com.ryangwaite.score

/**
 * This is determined by the following equation:
 *     score = 100 * (num correct answers / total correct answers) * ((maxTimeToAnswer - participantTimeToAnswer) / maxTimeToAnswer)
 */
fun calculateAnswerScore(correctAnswerIndexes: List<Int>, participantAnswerIndexes: List<Int>, maxTimeToAnswer: Int, participantTimeToAnswer: Int): Int {
    val numCorrectAnswers = participantAnswerIndexes.fold(0) { acc: Int, i: Int -> if (correctAnswerIndexes.contains(i)) acc + 1 else acc }
    val correctAnswerRatio = numCorrectAnswers.toDouble() / correctAnswerIndexes.size
    val answerTimeRatio = (maxTimeToAnswer - participantTimeToAnswer).toDouble() / maxTimeToAnswer
    return (100 * correctAnswerRatio * answerTimeRatio).toInt()
}