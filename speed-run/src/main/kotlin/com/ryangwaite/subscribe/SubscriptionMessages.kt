package com.ryangwaite.subscribe

import kotlinx.serialization.Serializable

@Serializable
enum class SubscriptionMessages {
    `LEADERBOARD-UPDATED`,
    `NOTIFY-HOST-QUIZ-SUMMARY`,
    `QUIZ-STARTED`,
    `QUIZ-FINISHED`,
    `PARTICIPANT-FINISHED`
}

