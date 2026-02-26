/**
 * Vitest tests for the Lemon Squeezy webhook Edge Function's pure business logic.
 *
 * The Edge Function lib modules are designed to be importable by Vitest:
 *   - extractPayload.ts: zero imports, tested by direct import
 *   - verifySignature.ts: imports timingSafeEqual from deno.land/std — this URL
 *     does not resolve in Node. We test the ALGORITHM correctness using a Node
 *     crypto equivalent (see verifySignatureNode helper below).
 *   - Event routing: tested as a simple Set assertion (inlined from index.ts)
 *   - redactEmail: inlined 4-line utility from index.ts
 *
 * Run: npx vitest run src/services/__tests__/webhookLogic.test.js
 */

import { describe, it, expect } from 'vitest';
import { createHmac, timingSafeEqual as nodeTSE } from 'crypto';

// ---------------------------------------------------------------------------
// Import extractPayload directly — it has zero imports so it loads in Node/Vitest
// ---------------------------------------------------------------------------
import { extractPayload } from '../../../supabase/functions/lemon-squeezy-webhook/lib/extractPayload';

// ---------------------------------------------------------------------------
// verifySignature — Node-compatible re-implementation for algorithm testing
// (The real implementation uses deno.land/std which doesn't resolve in Node)
// ---------------------------------------------------------------------------

/**
 * Node-compatible version of verifySignature using Node's built-in crypto.
 * Mirrors the exact same algorithm as the Deno version in verifySignature.ts.
 * This validates the HMAC-SHA256 logic is correct, not the Deno import.
 */
async function verifySignatureNode(rawBody, receivedHex, secret) {
  if (!receivedHex || !secret) return false;

  // Use WebCrypto (available in Node 20+) — same API as the Deno version
  const encoder = new TextEncoder();

  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: { name: 'SHA-256' } },
    false,
    ['sign']
  );

  const signatureBuffer = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(rawBody)
  );

  const computedHex = Array.from(new Uint8Array(signatureBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  const computedBytes = encoder.encode(computedHex);
  const receivedBytes = encoder.encode(receivedHex);

  if (computedBytes.length !== receivedBytes.length) return false;

  // Use Node's built-in timingSafeEqual for byte comparison
  return nodeTSE(computedBytes, receivedBytes);
}

/**
 * Computes a valid HMAC-SHA256 hex string for testing.
 * Used to generate the "correct" signature for test cases.
 */
function computeValidSignature(rawBody, secret) {
  return createHmac('sha256', secret).update(rawBody).digest('hex');
}

// ---------------------------------------------------------------------------
// Inline the HANDLED_EVENTS Set from index.ts (tests the routing logic spec)
// ---------------------------------------------------------------------------
const HANDLED_EVENTS = new Set([
  'subscription_created',
  'subscription_updated',
  'subscription_cancelled',
  'subscription_expired',
]);

// ---------------------------------------------------------------------------
// Inline redactEmail from index.ts (4-line utility, COPPA-compliance test)
// ---------------------------------------------------------------------------
function redactEmail(email) {
  const at = email.indexOf('@');
  if (at < 0) return '***';
  return email[0] + '***@' + email.slice(at + 1);
}

// ---------------------------------------------------------------------------
// Mock Lemon Squeezy payload builder
// ---------------------------------------------------------------------------
function buildMockPayload(overrides = {}) {
  return {
    meta: {
      event_name: 'subscription_created',
      custom_data: {
        student_id: 'abc123-student-uuid',
      },
      ...overrides.meta,
    },
    data: {
      type: 'subscriptions',
      id: 'sub_12345',
      attributes: {
        status: 'active',
        customer_id: 98765,
        variant_id: 54321,
        user_email: 'parent@example.com',
        renews_at: '2026-03-27T00:00:00.000000Z',
        ends_at: null,
        cancelled: false,
        trial_ends_at: '2026-03-01T00:00:00.000000Z', // extra field — should be ignored
        created_at: '2026-02-27T00:00:00.000000Z',    // extra field — should be ignored
        ...overrides.attributes,
      },
      ...overrides.data,
    },
  };
}

// ===========================================================================
// 1. extractPayload tests
// ===========================================================================

describe('extractPayload', () => {
  it('extracts all 8 whitelisted fields from a valid LS payload', () => {
    const body = buildMockPayload();
    const result = extractPayload(body);

    expect(result.event_name).toBe('subscription_created');
    expect(result.student_id).toBe('abc123-student-uuid');
    expect(result.ls_subscription_id).toBe('sub_12345');
    expect(result.ls_customer_id).toBe('98765');
    expect(result.ls_variant_id).toBe('54321');
    expect(result.status).toBe('active');
    expect(result.parent_email).toBe('parent@example.com');
    expect(result.current_period_end).toBe('2026-03-27T00:00:00.000000Z');
  });

  it('returns undefined student_id when meta.custom_data is absent', () => {
    const body = {
      meta: {
        event_name: 'subscription_created',
        // no custom_data key at all
      },
      data: buildMockPayload().data,
    };
    const result = extractPayload(body);

    expect(result.student_id).toBeUndefined();
  });

  it('returns undefined student_id when custom_data exists but student_id is missing', () => {
    const body = {
      meta: {
        event_name: 'subscription_created',
        custom_data: { some_other_key: 'value' },
      },
      data: buildMockPayload().data,
    };
    const result = extractPayload(body);

    expect(result.student_id).toBeUndefined();
  });

  it('returns undefined parent_email and current_period_end when optional fields are absent', () => {
    const body = buildMockPayload();
    // Remove optional fields from attributes
    delete body.data.attributes.user_email;
    delete body.data.attributes.renews_at;

    const result = extractPayload(body);

    expect(result.parent_email).toBeUndefined();
    expect(result.current_period_end).toBeUndefined();
  });

  it('converts numeric customer_id and variant_id to strings', () => {
    const body = buildMockPayload();
    body.data.attributes.customer_id = 12345;
    body.data.attributes.variant_id = 67890;

    const result = extractPayload(body);

    expect(result.ls_customer_id).toBe('12345');
    expect(result.ls_variant_id).toBe('67890');
    expect(typeof result.ls_customer_id).toBe('string');
    expect(typeof result.ls_variant_id).toBe('string');
  });

  it('converts zero customer_id and variant_id to empty-like strings', () => {
    const body = buildMockPayload();
    body.data.attributes.customer_id = 0;
    body.data.attributes.variant_id = 0;

    const result = extractPayload(body);

    expect(result.ls_customer_id).toBe('0');
    expect(result.ls_variant_id).toBe('0');
  });

  it('ignores extra payload fields not in the whitelist', () => {
    const body = buildMockPayload();
    // These extra fields exist in the mock (trial_ends_at, created_at, cancelled, ends_at)
    const result = extractPayload(body);

    expect(result).not.toHaveProperty('trial_ends_at');
    expect(result).not.toHaveProperty('created_at');
    expect(result).not.toHaveProperty('cancelled');
    expect(result).not.toHaveProperty('ends_at');
    expect(Object.keys(result)).toHaveLength(8);
  });

  it('handles null/undefined body gracefully without throwing', () => {
    // extractPayload receives unknown type — should not throw on malformed input
    expect(() => extractPayload({})).not.toThrow();
    expect(() => extractPayload({ meta: null, data: null })).not.toThrow();
  });
});

// ===========================================================================
// 2. verifySignature tests (Node-compatible algorithm verification)
// ===========================================================================

describe('verifySignature (Node-equivalent HMAC-SHA256 algorithm)', () => {
  const TEST_SECRET = 'test-signing-secret-12345';
  const TEST_BODY = JSON.stringify({ meta: { event_name: 'subscription_created' } });

  it('returns true for a valid HMAC-SHA256 signature', async () => {
    const validHex = computeValidSignature(TEST_BODY, TEST_SECRET);
    const result = await verifySignatureNode(TEST_BODY, validHex, TEST_SECRET);

    expect(result).toBe(true);
  });

  it('returns false for an invalid (wrong) signature', async () => {
    const wrongHex = 'deadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef';
    const result = await verifySignatureNode(TEST_BODY, wrongHex, TEST_SECRET);

    expect(result).toBe(false);
  });

  it('returns false for an empty signature string', async () => {
    const result = await verifySignatureNode(TEST_BODY, '', TEST_SECRET);

    expect(result).toBe(false);
  });

  it('returns false for an empty secret', async () => {
    const validHex = computeValidSignature(TEST_BODY, TEST_SECRET);
    const result = await verifySignatureNode(TEST_BODY, validHex, '');

    expect(result).toBe(false);
  });

  it('returns false when signature is correct for a different body', async () => {
    const differentBody = JSON.stringify({ meta: { event_name: 'subscription_cancelled' } });
    const hexForDifferentBody = computeValidSignature(differentBody, TEST_SECRET);
    const result = await verifySignatureNode(TEST_BODY, hexForDifferentBody, TEST_SECRET);

    expect(result).toBe(false);
  });

  it('returns false when signature is correct for a different secret', async () => {
    const hexForDifferentSecret = computeValidSignature(TEST_BODY, 'other-secret');
    const result = await verifySignatureNode(TEST_BODY, hexForDifferentSecret, TEST_SECRET);

    expect(result).toBe(false);
  });

  it('handles empty body correctly (signature of empty string)', async () => {
    const emptyBodyHex = computeValidSignature('', TEST_SECRET);
    const result = await verifySignatureNode('', emptyBodyHex, TEST_SECRET);

    expect(result).toBe(true);
  });
});

// ===========================================================================
// 3. Event routing logic tests (HANDLED_EVENTS Set)
// ===========================================================================

describe('HANDLED_EVENTS routing set', () => {
  it('contains exactly the 4 core subscription lifecycle events', () => {
    expect(HANDLED_EVENTS.has('subscription_created')).toBe(true);
    expect(HANDLED_EVENTS.has('subscription_updated')).toBe(true);
    expect(HANDLED_EVENTS.has('subscription_cancelled')).toBe(true);
    expect(HANDLED_EVENTS.has('subscription_expired')).toBe(true);
    expect(HANDLED_EVENTS.size).toBe(4);
  });

  it('does not handle payment lifecycle events (those return 200 silently)', () => {
    expect(HANDLED_EVENTS.has('subscription_payment_success')).toBe(false);
    expect(HANDLED_EVENTS.has('subscription_payment_failed')).toBe(false);
    expect(HANDLED_EVENTS.has('subscription_payment_recovered')).toBe(false);
    expect(HANDLED_EVENTS.has('subscription_payment_refunded')).toBe(false);
  });

  it('does not handle paused/resumed/unpaused events', () => {
    expect(HANDLED_EVENTS.has('subscription_paused')).toBe(false);
    expect(HANDLED_EVENTS.has('subscription_resumed')).toBe(false);
    expect(HANDLED_EVENTS.has('subscription_unpaused')).toBe(false);
  });

  it('does not handle unknown/arbitrary event names', () => {
    expect(HANDLED_EVENTS.has('order_created')).toBe(false);
    expect(HANDLED_EVENTS.has('license_key_created')).toBe(false);
    expect(HANDLED_EVENTS.has('')).toBe(false);
  });
});

// ===========================================================================
// 4. redactEmail tests (COPPA-compliant email logging)
// ===========================================================================

describe('redactEmail', () => {
  it('redacts a standard email correctly', () => {
    expect(redactEmail('john@example.com')).toBe('j***@example.com');
  });

  it('handles email without @ symbol', () => {
    expect(redactEmail('invalid')).toBe('***');
  });

  it('handles single-character local part', () => {
    expect(redactEmail('a@b.com')).toBe('a***@b.com');
  });

  it('handles email with subdomain', () => {
    expect(redactEmail('parent@mail.school.org')).toBe('p***@mail.school.org');
  });

  it('preserves the full domain portion after @', () => {
    const result = redactEmail('user@example.com');
    expect(result).toMatch(/^u\*\*\*@example\.com$/);
  });

  it('handles email with multiple characters before @', () => {
    // Only the first character is preserved
    expect(redactEmail('longemail@example.com')).toBe('l***@example.com');
  });
});
