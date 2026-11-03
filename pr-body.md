Adopt optimistic merge.

What changed: the merge queue runs the fast gate (lint, types, tests, the zh-hant and identifier checks, stack conformance); the production build moves to a new verify workflow that runs on each push to main and on a ready pull request. Added the red-main handler, a main-state job (observe mode) that ci-ok needs, and `[ci] merge = "optimistic"` with `on_red = "revert"` in sylphx.toml.

The dependencies from SylphxAI/.github are pinned at the current policy floor `8bbd9a3` (the classifier that judges a failure by each failing step's terminal error), and the two verdict jobs use the current condition `if: always() && !cancelled()` so a superseded pull-request run does not publish a stale red aggregate beside its replacement.

Why: shorter queue time; the full suite is proven on the trunk after merge.

Tested: YAML parse of all three workflows, actionlint over them, the repo's runner-profile check, and `bun run check` in the remote build lease.
