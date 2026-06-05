# Maintainer Lens

Maintainer Lens is a small GitHub Action and CLI that turns issue and pull request
events into a concise maintainer brief: priority, suggested labels, risk notes,
next actions, and a draft reply.

It is designed for open source maintainers who need a calm first pass over busy
queues without giving up judgment or project context.

## Why this exists

Open source maintenance often fails in the gaps between coding, triage, release
work, and user support. Maintainer Lens helps reduce that coordination load by
standardizing the first triage pass for issues and pull requests.

The project is intentionally lightweight:

- no database
- no required external dependencies
- works as a GitHub Action or local CLI
- deterministic fallback behavior when no AI provider is configured
- project rules live in the repository through `maintainer-lens.yml`

## Features

- Summarizes GitHub issue and pull request event payloads.
- Suggests priority, labels, and next maintainer actions.
- Produces a draft response suitable for editing before posting.
- Supports local dry runs for maintainers who want to inspect behavior.
- Keeps AI usage optional through `OPENAI_API_KEY`.

## Quick Start

Create `.github/workflows/maintainer-lens.yml`:

```yaml
name: Maintainer Lens

on:
  issues:
    types: [opened, edited]
  pull_request_target:
    types: [opened, edited, synchronize]

permissions:
  contents: read
  issues: write
  pull-requests: write

jobs:
  triage:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: ./ 
        with:
          post-comment: "false"
        env:
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
```

For local testing:

```bash
node src/index.js --event examples/issue_event.json --dry-run
```

## Configuration

Add `maintainer-lens.yml` to your repository root:

```yaml
project:
  name: Example Project
  maintainers:
    - "@alice"

triage:
  labels:
    bug: ["crash", "error", "regression"]
    docs: ["documentation", "readme", "guide"]
    question: ["how do i", "help", "usage"]
  high_priority_terms:
    - security
    - data loss
    - production
```

## Output

Maintainer Lens emits JSON to stdout:

```json
{
  "type": "issue",
  "priority": "medium",
  "labels": ["bug"],
  "summary": "User reports a regression after upgrading.",
  "next_actions": ["Ask for version and reproduction steps."],
  "draft_reply": "Thanks for the report. Could you share the affected version and a minimal reproduction?"
}
```

## Roadmap

- Post comments back to GitHub when `post-comment` is enabled.
- Add richer repository rule matching.
- Support release note drafting from merged pull requests.
- Add evaluation fixtures for common maintainer workflows.
- Publish to GitHub Marketplace.

## Applying for Codex for Open Source

This repository is designed to demonstrate the kind of maintenance work Codex can
accelerate: triage, review preparation, release coordination, and contributor
support. A strong application should also include evidence that the project is
actively maintained and useful to others, such as contributors, issues, releases,
stars, downstream users, or adoption in another public repository.

## License

MIT
