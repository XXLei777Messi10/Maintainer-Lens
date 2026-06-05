import test from "node:test";
import assert from "node:assert/strict";
import { buildBrief, suggestLabels } from "../src/index.js";

test("suggests labels from configured terms", () => {
  assert.deepEqual(suggestLabels("The README usage guide is confusing"), ["docs", "question"]);
});

test("builds a high priority issue brief for security reports", () => {
  const brief = buildBrief({
    issue: {
      title: "Security regression in token handling",
      body: "After the last release, production tokens can leak in logs.",
      user: { login: "contributor" }
    }
  });

  assert.equal(brief.type, "issue");
  assert.equal(brief.priority, "high");
  assert.ok(brief.labels.includes("bug"));
  assert.ok(brief.draft_reply.includes("@contributor"));
});
