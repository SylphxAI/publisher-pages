Pin the red-main caller at the policy floor.

What changed: `.github/workflows/red-main.yml` now calls the shared handler at `8bbd9a3` instead of `05ac647`.

Why: `policy/optimistic-merge.json` moves its floor forward when a fix every caller needs lands. `8bbd9a3` is the commit that classifies a failure by each failing step's terminal error; a caller behind the floor fails the conformance row R4.

Tested: YAML parse and actionlint over the workflow.
