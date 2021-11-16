package com.ryangwaite.models

/**
 * Contains info for obtaining and retaining and authorized session. The
 * [access_token] should be communicated to the server in subsequent requests.
 *
 * Modeled after https://self-issued.info/docs/draft-ietf-oauth-v2-bearer.html#ExAccTokResp
 */
data class AuthorizationResponse(
    val access_token: String,
    val token_type: String = "JWT",
    val expires_in: Int = 3600, // seconds
    val refresh_token: String,
)