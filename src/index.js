#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import process from "node:process";

const DEFAULT_RULES = {
  labels: {
    bug: ["crash", "error", "regression", "broken"],
    docs: ["documentation", "readme", "guide", "tutorial"],
    question: ["how do i", "help", "usage", "support"]
  },
  highPriorityTerms: ["security", "data loss", "production", "vulnerability"]
};

function parseArgs(argv) {
  const args = { dryRun: false };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--event") {
      args.eventPath = argv[index + 1];
      index += 1;
    } else if (arg === "--dry-run") {
      args.dryRun = true;
    }
  }

  args.eventPath ||= process.env.GITHUB_EVENT_PATH;
  return args;
}

async function loadEvent(path) {
  if (!path) {
    throw new Error("Missing event payload. Pass --event or set GITHUB_EVENT_PATH.");
  }

  return JSON.parse(await readFile(path, "utf8"));
}

function getEventSubject(event) {
  if (event.issue) {
    return {
      type: "issue",
      title: event.issue.title || "",
      body: event.issue.body || "",
      author: event.issue.user?.login || "unknown"
    };
  }

  if (event.pull_request) {
    return {
      type: "pull_request",
      title: event.pull_request.title || "",
      body: event.pull_request.body || "",
      author: event.pull_request.user?.login || "unknown"
    };
  }

  return {
    type: "unknown",
    title: event.action || "GitHub event",
    body: JSON.stringify(event).slice(0, 1000),
    author: "unknown"
  };
}

function includesAny(text, terms) {
  const normalized = text.toLowerCase();
  return terms.some((term) => normalized.includes(term.toLowerCase()));
}

function suggestLabels(text, rules = DEFAULT_RULES) {
  return Object.entries(rules.labels)
    .filter(([, terms]) => includesAny(text, terms))
    .map(([label]) => label);
}

function summarize(subject) {
  const compactBody = subject.body.replace(/\s+/g, " ").trim();
  if (!compactBody) {
    return `${subject.author} opened a ${subject.type} titled "${subject.title}".`;
  }

  return compactBody.length > 180 ? `${compactBody.slice(0, 177)}...` : compactBody;
}

function buildBrief(event) {
  const subject = getEventSubject(event);
  const text = `${subject.title}\n${subject.body}`;
  const labels = suggestLabels(text);
  const priority = includesAny(text, DEFAULT_RULES.highPriorityTerms) ? "high" : "medium";

  const nextActions = [];
  if (labels.includes("bug")) {
    nextActions.push("Ask for affected version, environment, and reproduction steps.");
  }
  if (labels.includes("docs")) {
    nextActions.push("Check whether the requested documentation belongs in README or docs.");
  }
  if (labels.includes("question")) {
    nextActions.push("Answer with a short pointer and consider adding it to documentation.");
  }
  if (nextActions.length === 0) {
    nextActions.push("Review context and decide whether this needs maintainer action.");
  }

  return {
    type: subject.type,
    priority,
    labels,
    summary: summarize(subject),
    next_actions: nextActions,
    draft_reply: `Thanks @${subject.author}. I will take a look and follow up with the next step.`
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const event = await loadEvent(args.eventPath);
  const brief = buildBrief(event);
  process.stdout.write(`${JSON.stringify(brief, null, 2)}\n`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main().catch((error) => {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  });
}

export { buildBrief, getEventSubject, suggestLabels };
