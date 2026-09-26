# publisher-pages

Read [README.md](README.md) and [docs/vision.md](docs/vision.md) first.

- Run `bun run check` before pushing; `bun run build` must succeed.
- Every URL a page uses must stay under `/apps` or `/open-source`, or be one of
  the two app-link files: those are the only paths mounted on sylphx.com.
  Language twins go under the prefix (`/apps/zh-hant/…`). The tests enforce it.
- Product text lives here, never in SylphxAI/cloud.
- Update docs/vision.md "State" in the same pull request when the served state changes.
