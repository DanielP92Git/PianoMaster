// Pure function — no Deno runtime APIs other than crypto.subtle (global WebCrypto)
// Source: https://docs.deno.com/examples/hmac_generate_verify/
//         https://docs.lemonsqueezy.com/help/webhooks/signing-requests

import { timingSafeEqual } from 'https://deno.land/std@0.224.0/crypto/timing_safe_equal.ts';

/**
 * Verifies an HMAC-SHA256 signature from a Lemon Squeezy webhook.
 *
 * @param rawBody  - The raw request body as a string (must be the exact bytes before any parsing)
 * @param receivedHex - The hex-encoded signature from the X-Signature header
 * @param secret   - The LS_SIGNING_SECRET environment variable value
 * @returns true if the signature is valid, false otherwise
 */
export async function verifySignature(
  rawBody: string,
  receivedHex: string,
  secret: string
): Promise<boolean> {
  // Guard: missing or empty signature/secret = reject immediately
  if (!receivedHex || !secret) return false;

  const encoder = new TextEncoder();

  // Import the secret as an HMAC-SHA256 key
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: { name: 'SHA-256' } },
    false,
    ['sign']
  );

  // Compute HMAC over the raw body bytes
  const signatureBuffer = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(rawBody)
  );

  // Convert computed HMAC buffer to lowercase hex string (matches LS X-Signature format)
  const computedHex = Array.from(new Uint8Array(signatureBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  // Encode both hex strings as Uint8Array for timing-safe comparison
  const computedBytes = encoder.encode(computedHex);
  const receivedBytes = encoder.encode(receivedHex);

  // Length-check: timingSafeEqual requires equal-length buffers
  // Different lengths always means mismatch — return false instead of throwing
  if (computedBytes.length !== receivedBytes.length) return false;

  // Timing-safe comparison: constant-time regardless of where the mismatch occurs
  return timingSafeEqual(computedBytes, receivedBytes);
}
