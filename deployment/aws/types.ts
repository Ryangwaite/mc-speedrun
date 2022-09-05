
/**
 * Collection of JWT parameters that are common across a few constructs
 */
export interface Jwt {
    secret: string
    audience: string
    issuer: string
}