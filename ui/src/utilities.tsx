import { getSignOnBaseUrl } from "./const";

/**
 * Gets the ordinal e.g. "st", "nd", "rd", "th"
 *
 * Modified from https://community.shopify.com/c/shopify-design/ordinal-number-in-javascript-1st-2nd-3rd-4th/m-p/72156
 *
 * @param value number to get ordinal for
 */
export function getOrdinal(value: number): string {
    var s = ["th", "st", "nd", "rd"],
        v = value % 100;
    return s[(v - 20) % 10] || s[v] || s[0];
}

/**
 * Wrapper around 'fetch' for all requests destined for the sign-on service
 * @param route 
 * @param init 
 * @returns 
 */
export function fetchSignOn(route: string, init?: RequestInit | undefined): Promise<Response> {
    const url = getSignOnBaseUrl() + route
    return fetch(url, {
        cache: "no-cache",
        ...init
    })
}