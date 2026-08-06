#!/usr/bin/env node
// =============================================================================
// 05-webhook-replay.mjs
// Phase 5 (v4.0) subscription re-pointing -- D-10a HMAC-signed synthetic
// webhook replay harness.
//
// This is a STANDALONE Node ESM script, NOT part of the app's Vitest suite --
// it makes real HTTP POSTs to whatever WEBHOOK_URL points at.
//
// WARNING -- this script writes REAL rows to whatever database WEBHOOK_URL's
// deployed function is connected to. The default and strongly-preferred
// target is the local/sandbox stack (05-sandbox-runbook.md). If it is EVER
// pointed at the production Edge Function, the sim_verify_ cleanup block
// printed at the end of this run is MANDATORY and must be recorded in
// 05-apply-log.md.
//
// Usage:
//   WEBHOOK_URL=https://<ref>.supabase.co/functions/v1/lemon-squeezy-webhook \
//   LS_SIGNING_SECRET=<the deployed secret> \
//   REPLAY_PARENT_ID=<a real parents.id> \
//   REPLAY_LINKED_CHILD_ID=<a real child_profiles.id WITH a parent_id> \
//   REPLAY_ORPHAN_CHILD_ID=<a real child_profiles.id with parent_id IS NULL> \
//   node 05-webhook-replay.mjs [--only=B3]
//
// Source: HMAC algorithm verified byte-identical to
//         src/services/__tests__/webhookLogic.test.js's verifySignatureNode()/
//         computeValidSignature() helpers, which are themselves verified
//         equivalent to supabase/functions/lemon-squeezy-webhook/lib/
//         verifySignature.ts's Deno WebCrypto implementation.
// =============================================================================

import { createHmac } from "node:crypto";

// ---------------------------------------------------------------------------
// Configuration -- ALL from the environment, NOTHING hardcoded. The signing
// secret in particular must never have a literal-string fallback and must
// never be printed.
// ---------------------------------------------------------------------------
const WEBHOOK_URL = process.env.WEBHOOK_URL;
const SIGNING_SECRET = process.env.LS_SIGNING_SECRET;
const PARENT_ID = process.env.REPLAY_PARENT_ID;
const LINKED_CHILD_ID = process.env.REPLAY_LINKED_CHILD_ID;
const ORPHAN_CHILD_ID = process.env.REPLAY_ORPHAN_CHILD_ID;
const VARIANT_ID = process.env.REPLAY_VARIANT_ID ?? "111111";

const REQUIRED_VARS = {
  WEBHOOK_URL,
  LS_SIGNING_SECRET: SIGNING_SECRET,
  REPLAY_PARENT_ID: PARENT_ID,
  REPLAY_LINKED_CHILD_ID: LINKED_CHILD_ID,
  REPLAY_ORPHAN_CHILD_ID: ORPHAN_CHILD_ID,
};

const missingVars = Object.entries(REQUIRED_VARS)
  .filter(([, value]) => !value)
  .map(([name]) => name);

if (missingVars.length > 0) {
  console.error(
    `Missing required environment variable(s): ${missingVars.join(", ")}`
  );
  console.error(
    "Set WEBHOOK_URL, LS_SIGNING_SECRET, REPLAY_PARENT_ID, REPLAY_LINKED_CHILD_ID, " +
      "and REPLAY_ORPHAN_CHILD_ID before running this script. See the header comment " +
      "for the full invocation shape, or 05-sandbox-runbook.md section 2."
  );
  process.exit(1);
}

// RUN_STAMP + the sim_verify_ prefix (RESEARCH Pitfall 4): every synthetic
// ls_subscription_id this script writes is greppable and has an explicit
// cleanup step printed at the end of the run.
const RUN_STAMP = new Date().toISOString().slice(0, 10);
let simCounter = 0;
function nextSimId() {
  simCounter += 1;
  return `sim_verify_${RUN_STAMP}_${simCounter}`;
}

// CLI filter: --only=B3 (comma-separated allowed, e.g. --only=B3,B8)
const onlyArg = process.argv.find((a) => a.startsWith("--only="));
const onlyBranches = onlyArg
  ? new Set(onlyArg.slice("--only=".length).split(","))
  : null;

// ---------------------------------------------------------------------------
// Core sender -- RESEARCH Pitfall 3 lives here. The raw body is computed ONCE
// and that EXACT string is both signed and sent. Passing the object to fetch
// would let it re-serialize with different key order/whitespace, and
// verifySignature.ts compares against req.text()'s raw bytes byte-for-byte.
// ---------------------------------------------------------------------------
async function sendSignedWebhook(label, payloadObj, { corruptSignature = false } = {}) {
  const rawBody = JSON.stringify(payloadObj);
  let signature = createHmac("sha256", SIGNING_SECRET).update(rawBody).digest("hex");
  if (corruptSignature) {
    // B8 negative control: flip the first hex char so the signature is
    // well-formed but wrong.
    signature = (signature[0] === "0" ? "1" : "0") + signature.slice(1);
  }

  let res;
  let text;
  try {
    res = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Signature": signature },
      body: rawBody, // the SAME string that was signed, not payloadObj
    });
    text = await res.text();
  } catch (err) {
    console.log(`[${label}] NETWORK ERROR :: ${err.message}`);
    return { status: null, text: String(err.message) };
  }

  console.log(`[${label}] HTTP ${res.status} :: ${text}`);
  return { status: res.status, text };
}

// buildPayload -- the LS JSON:API shape extractPayload.ts expects.
function buildPayload({
  customData,
  lsSubscriptionId,
  status = "active",
  eventName = "subscription_created",
}) {
  return {
    meta: {
      event_name: eventName,
      custom_data: customData,
    },
    data: {
      id: lsSubscriptionId,
      type: "subscriptions",
      attributes: {
        status,
        customer_id: 999999,
        variant_id: Number(VARIANT_ID),
        user_email: "sim-verify@example.invalid",
        renews_at: "2027-01-01T00:00:00.000000Z",
      },
    },
  };
}

// ---------------------------------------------------------------------------
// Branches B1..B10
// ---------------------------------------------------------------------------
const results = [];

async function runBranch(id, description, expected, fn) {
  if (onlyBranches && !onlyBranches.has(id)) return;
  console.log(`\n--- ${id}: ${description}`);
  console.log(`    EXPECTED: ${expected}`);
  const outcome = await fn();
  results.push({ id, description, expected, ...outcome });
}

async function main() {
  // B1 -- D-02 new shape: parent_id only.
  await runBranch(
    "B1",
    "D-02 new checkout shape ({ parent_id })",
    'HTTP 200 "OK"; a parent_subscriptions row with parent_id = PARENT_ID, student_id NULL',
    async () => {
      const lsId = nextSimId();
      const { status, text } = await sendSignedWebhook(
        "B1",
        buildPayload({ customData: { parent_id: PARENT_ID }, lsSubscriptionId: lsId })
      );
      return { status, text, lsSubscriptionId: lsId };
    }
  );

  // B2 -- D-01 legacy shape, probe 1 hit (student_id IS a parents.id).
  await runBranch(
    "B2",
    "D-01 legacy shape, resolve-chain probe 1 hit ({ student_id: PARENT_ID })",
    'HTTP 200 "OK"; same row shape -- proves the legacy payload resolves with no LS-side change (SC-3)',
    async () => {
      const lsId = nextSimId();
      const { status, text } = await sendSignedWebhook(
        "B2",
        buildPayload({ customData: { student_id: PARENT_ID }, lsSubscriptionId: lsId })
      );
      return { status, text, lsSubscriptionId: lsId };
    }
  );

  // B3 -- D-01 legacy shape, probe 2 hit (student_id is a child_profiles.id
  // with a parent). The one branch real traffic will never exercise.
  await runBranch(
    "B3",
    "D-01 legacy shape, resolve-chain probe 2 hit -- the child_profiles hop ({ student_id: LINKED_CHILD_ID })",
    "HTTP 200 \"OK\"; row's parent_id = that child's parent_id, NOT the child id",
    async () => {
      const lsId = nextSimId();
      const { status, text } = await sendSignedWebhook(
        "B3",
        buildPayload({ customData: { student_id: LINKED_CHILD_ID }, lsSubscriptionId: lsId })
      );
      return { status, text, lsSubscriptionId: lsId };
    }
  );

  // B4 -- D-02 preference: both keys present, parent_id must win.
  await runBranch(
    "B4",
    "D-02 preference: both parent_id and student_id present ({ parent_id: PARENT_ID, student_id: LINKED_CHILD_ID })",
    "HTTP 200 \"OK\"; row's parent_id = PARENT_ID -- proves parent_id wins when both are present",
    async () => {
      const lsId = nextSimId();
      const { status, text } = await sendSignedWebhook(
        "B4",
        buildPayload({
          customData: { parent_id: PARENT_ID, student_id: LINKED_CHILD_ID },
          lsSubscriptionId: lsId,
        })
      );
      return { status, text, lsSubscriptionId: lsId };
    }
  );

  // B5 -- D-03 unresolvable: a synthetic uuid that matches nothing.
  await runBranch(
    "B5",
    "D-03 unresolvable id ({ student_id: <synthetic uuid matching nothing> })",
    'HTTP 200 "Unresolved parent — recorded for review"; a new unresolved_webhook_log row; WEBHOOK_UNRESOLVED: in function logs',
    async () => {
      const lsId = nextSimId();
      const { status, text } = await sendSignedWebhook(
        "B5",
        buildPayload({
          customData: { student_id: "00000000-0000-0000-0000-000000000fff" },
          lsSubscriptionId: lsId,
        })
      );
      return { status, text, lsSubscriptionId: lsId };
    }
  );

  // B6 -- D-03 parent-less child: a teacher-owned profile has no parent to bill.
  await runBranch(
    "B6",
    "D-03 parent-less child ({ student_id: ORPHAN_CHILD_ID }) -- teacher-owned profile, parent_id IS NULL",
    "identical to B5 -- a teacher-owned profile has no parent to bill",
    async () => {
      const lsId = nextSimId();
      const { status, text } = await sendSignedWebhook(
        "B6",
        buildPayload({ customData: { student_id: ORPHAN_CHILD_ID }, lsSubscriptionId: lsId })
      );
      return { status, text, lsSubscriptionId: lsId };
    }
  );

  // B7 -- D-03 empty custom_data: replaces the old silent "Missing student_id" drop.
  await runBranch(
    "B7",
    "D-03 empty custom_data ({})",
    "identical to B5 -- replaces the old silent \"Missing student_id\" 200-and-drop",
    async () => {
      const lsId = nextSimId();
      const { status, text } = await sendSignedWebhook(
        "B7",
        buildPayload({ customData: {}, lsSubscriptionId: lsId })
      );
      return { status, text, lsSubscriptionId: lsId };
    }
  );

  // B8 -- signature negative control (T-5-01): deliberately corrupted signature.
  await runBranch(
    "B8",
    "Signature negative control -- deliberately corrupted X-Signature",
    'HTTP 400 "Invalid signature"; NO DB row and NO dead-letter row -- proves T-5-01 still holds after the rewire',
    async () => {
      const lsId = nextSimId();
      const { status, text } = await sendSignedWebhook(
        "B8",
        buildPayload({ customData: { parent_id: PARENT_ID }, lsSubscriptionId: lsId }),
        { corruptSignature: true }
      );
      return { status, text, lsSubscriptionId: lsId };
    }
  );

  // B9 -- unhandled event type.
  await runBranch(
    "B9",
    "Unhandled event type (order_created)",
    'HTTP 200 "Event not handled"; no row anywhere',
    async () => {
      const lsId = nextSimId();
      const { status, text } = await sendSignedWebhook(
        "B9",
        buildPayload({
          customData: { parent_id: PARENT_ID },
          lsSubscriptionId: lsId,
          eventName: "order_created",
        })
      );
      return { status, text, lsSubscriptionId: lsId };
    }
  );

  // B10 -- D-08 duplicate active: two sends, different ls_subscription_id,
  // same parent_id, both status active.
  await runBranch(
    "B10",
    "D-08 duplicate active -- two rows for the same parent, both status=active",
    "both HTTP 200 -- the parent now has 2 qualifying rows, the state plan 05-08 uses to exercise cancel-subscription's 409",
    async () => {
      const lsIdA = nextSimId();
      const lsIdB = nextSimId();
      const first = await sendSignedWebhook(
        "B10a",
        buildPayload({ customData: { parent_id: PARENT_ID }, lsSubscriptionId: lsIdA })
      );
      const second = await sendSignedWebhook(
        "B10b",
        buildPayload({ customData: { parent_id: PARENT_ID }, lsSubscriptionId: lsIdB })
      );
      return {
        status: first.status === 200 && second.status === 200 ? 200 : first.status,
        text: `first=${first.status} ${first.text} | second=${second.status} ${second.text}`,
        lsSubscriptionId: `${lsIdA}, ${lsIdB}`,
      };
    }
  );

  // ---------------------------------------------------------------------------
  // Summary table -- PASS/CHECK per branch based on HTTP status and response
  // text only. DB assertions are the operator's job -- the follow-up SQL below
  // is how to actually check them.
  // ---------------------------------------------------------------------------
  console.log("\n\n=== SUMMARY ===");
  console.log(
    "PASS/CHECK here reflects the HTTP layer only. Verify each row's DB state with the follow-up SQL below."
  );
  for (const r of results) {
    const verdict = r.status !== null ? "CHECK" : "FAIL (network error)";
    console.log(`${r.id}: ${verdict} -- HTTP ${r.status} -- ls_subscription_id(s): ${r.lsSubscriptionId}`);
  }

  console.log("\n=== FOLLOW-UP SQL (run against whatever database WEBHOOK_URL points at) ===");
  console.log(`
SELECT ls_subscription_id, parent_id, student_id, status
FROM parent_subscriptions WHERE ls_subscription_id LIKE 'sim_verify_%' ORDER BY ls_subscription_id;

SELECT received_at, event_name, ls_subscription_id, attempted_id
FROM unresolved_webhook_log WHERE ls_subscription_id LIKE 'sim_verify_%' ORDER BY received_at;
`);

  console.log("=== CLEANUP (mandatory if WEBHOOK_URL pointed at production -- record in 05-apply-log.md) ===");
  console.log(`
DELETE FROM parent_subscriptions   WHERE ls_subscription_id LIKE 'sim_verify_%';
SELECT * FROM unresolved_webhook_log WHERE ls_subscription_id LIKE 'sim_verify_%';  -- inspect, then delete
DELETE FROM unresolved_webhook_log WHERE ls_subscription_id LIKE 'sim_verify_%';
`);
}

main().catch((err) => {
  console.error("05-webhook-replay.mjs: unexpected error", err);
  process.exit(1);
});
