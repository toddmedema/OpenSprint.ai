import crypto from "crypto";

const ALPHABET = "abcdefghijklmnopqrstuvwxyz0123456789";
const LENGTH = 6;

/**
 * Generate a short feedback ID: 6 alphanumeric characters (a-z, 0-9).
 * Uses crypto.randomBytes for cryptographic randomness.
 * 36^6 ≈ 2.2 billion possible values; collision probability is negligible for typical projects.
 */
export function generateShortFeedbackId(): string {
  const bytes = crypto.randomBytes(LENGTH);
  let result = "";
  for (let i = 0; i < LENGTH; i++) {
    result += ALPHABET[bytes[i]! % ALPHABET.length];
  }
  return result;
}
