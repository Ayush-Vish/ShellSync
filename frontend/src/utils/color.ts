/**
 * Converts a string (like a client ID) into a unique, hashed hue value from 0 to 360.
 * This uses a simple FNV-1a hashing algorithm.
 * @param name The string to hash.
 * @returns A number representing a hue value in the HSL color space.
 */
export function nameToHue(name: string): number {
    // FNV-1a hashing algorithm constants
    let hash = 2166136261;

    for (let i = 0; i < name.length; i++) {
        // XOR the hash with the character code, then multiply by the FNV prime
        hash = (hash ^ name.charCodeAt(i)) * 16777619;
    }

    // Ensure the result is a 32-bit signed integer
    hash = hash & hash;

    // Normalize the hash to a value between 0 and 1, then scale to 360 for the hue
    // We use Math.abs to ensure the value is positive.
    return Math.abs(hash % 360);
}
