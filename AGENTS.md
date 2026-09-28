# publisher-pages

Read [README.md](README.md) and [docs/vision.md](docs/vision.md) first.

- Run `bun run check` before pushing; `bun run build` must succeed.
- Every URL a page uses must stay under `/apps` or `/open-source`, or be one of
  the two app-link files: those are the only paths mounted on sylphx.com.
  Language twins go under the prefix (`/apps/zh-hant/…`). The tests enforce it.
- Product text lives here, never in SylphxAI/cloud.
- The publisher's look comes from SylphxAI/brand, vendored into `vendor/brand/`
  by `scripts/sync-brand.sh`. Never edit a vendored file, redraw a logo or pick
  a colour: run the script against a brand checkout, and let the script record
  the new commit and hashes. `tests/brand.test.ts` enforces both.
- Update docs/vision.md "State" in the same pull request when the served state changes.
