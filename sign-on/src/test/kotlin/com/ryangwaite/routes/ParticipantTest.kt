package com.ryangwaite.routes

import io.ktor.http.*
import kotlin.test.*
import io.ktor.server.testing.*
import org.junit.jupiter.params.ParameterizedTest
import org.junit.jupiter.params.provider.ValueSource

class ParticipantTest {
    @ParameterizedTest(name = "Omitting code returns bad request")
    @ValueSource(strings = ["/join", "/join/"])
    fun `Omitting code returns bad request`(route: String) {
        withTestApplication({ participant() }) {
            handleRequest(HttpMethod.Post, route).apply {
                assertEquals(HttpStatusCode.NotFound, response.status())
            }
        }
    }

    @Test
    fun `Bad code returns not found`() {
        withTestApplication({ participant() }) {
            handleRequest(HttpMethod.Post, "/join/badcode").apply {
                assertEquals(HttpStatusCode.NotFound, response.status())
                assertEquals("Invalid code 'badcode' provided", response.content)
            }
        }
    }
}