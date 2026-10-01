# publisher-pages

The static pages for Sylphx-published apps on `sylphx.com/apps`: the hub, and
per app a landing, privacy, terms and support page in English and Traditional
Chinese, plus the app-link files. Start with [README.md](README.md) and
[docs/vision.md](docs/vision.md).

## Commands

- `bun run check` (lint, types, tests) before pushing; `bun run build` must succeed.
- `scripts/sync-brand.sh <brand checkout>` refreshes `vendor/brand/`.

## Rules and reasons

- Every URL a page uses stays under `/apps` or `/open-source`, or is one of
  the two app-link files, because only those paths are mounted on sylphx.com.
  Language twins go under the prefix (`/apps/zh-hant/...`,
  `/open-source/zh-hant`). The tests enforce it.
- Product text lives here, never in SylphxAI/cloud, so the platform repository
  names no product.
- The publisher's look comes from SylphxAI/brand, vendored by
  `scripts/sync-brand.sh`, which records the commit and hashes. Never edit
  `vendor/brand/`, redraw a logo or pick a colour: the brand home is the one
  source. `tests/brand.test.ts` enforces it.
- Pages ship no inline script, `<style>`, `style=` attribute or event handler,
  because nginx sends a strict Content Security Policy; `bun run check` catches
  violations.
- App copy carries no "Sylphx" branding; Sylphx appears only as publisher in
  legal pages and on the hub.
- The hub never lists Hypothesis-Idea products, `SylphxAI/bgca` or Cubeage
  titles (not ours to publish); the README has the reasons.
- Apps own their content as `publisher/app.json` in their own repository; this
  repository holds a copy. Every text field needs `en` and `zh-Hant`.

## Post-deploy check

After a deploy, `https://sylphx.com/apps` and `/apps/index.json` answer 200 and
list the expected apps, and one app's `/apps/{app}/privacy` answers 200.

Deploy and CI details: README.
