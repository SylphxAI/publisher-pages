# publisher-pages

Read [README.md](README.md) and [docs/vision.md](docs/vision.md) first.

- Run `bun run check` before pushing; `bun run build` must succeed.
- Every URL a page uses must stay under `/apps`, `/open-source`, their
  `/zh-hant` twins, or `/.well-known/`: those are the only paths mounted on
  sylphx.com. The tests enforce it.
- Product text lives here, never in SylphxAI/cloud.
- Update docs/vision.md "State" in the same pull request when the served state changes.
