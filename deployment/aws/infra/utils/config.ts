import { Jwt } from '../types'

export interface ParentZoneConfig {
    accountId: string
    delegationRoleName: string
    domainName: string
}

/**
 * Loader for loading in the config from environment variables
 */
export default class Config {

    public readonly jwt: Jwt
    public readonly parentZoneConfig: ParentZoneConfig

    private constructor(jwt: Jwt, parentZoneConfig: ParentZoneConfig) {
        this.jwt = jwt
        this.parentZoneConfig = parentZoneConfig
    }

    /**
     * Attempts to load the value of `varName` from the environment,
     * throwing an error if it is undefined or empty
     */
    private static loadFromEnvOrThrow(varName: string): string {
        const value = process.env[varName]

        if (!value) {
            throw new Error(`Required environment variable '${varName}' was absent`);
        }

        return value
    }

    /**
     * Loads all variables from config
     */
    public static load(): Config {

        const jwt: Jwt = {
            secret: this.loadFromEnvOrThrow("JWT_SECRET"),
            audience: this.loadFromEnvOrThrow("JWT_AUDIENCE"),
            issuer: this.loadFromEnvOrThrow("JWT_ISSUER"),
        }

        const parentZoneConfig: ParentZoneConfig = {
            accountId: this.loadFromEnvOrThrow("PARENT_ZONE_ACCOUNT_ID"),
            delegationRoleName: this.loadFromEnvOrThrow("PARENT_ZONE_ACCOUNT_ROLE_NAME"),
            domainName: this.loadFromEnvOrThrow("PARENT_ZONE_DOMAIN_NAME"),
        }

        return new Config(jwt, parentZoneConfig)
    }
}