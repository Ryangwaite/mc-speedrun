
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