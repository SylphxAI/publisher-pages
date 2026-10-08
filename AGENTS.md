# publisher-pages

The static pages for Sylphx-published apps and tools on `sylphx.com/apps` and `/open-source`: the two gallery hubs, and
per app a landing, privacy, terms and support page in English and Traditional
Chinese, plus the app-link files. Start with [README.md](README.md) and
[docs/vision.md](docs/vision.md).

## Commands

- `bun run check` (lint, types, tests) before pushing; `bun run build` must succeed.
- `scripts/sync-brand.sh <brand checkout>` refreshes `vendor/brand/`.

## Rules and reasons

- Every URL a page uses stays under `/apps` or `/open-source`, or is one of
  the two app-link files, because only those paths are mounted on sylphx.com;
  the shell links to platform pages listed in `PLATFORM_PATHS`. This
  repository serves both hubs. Language twins go under the prefix
  (`/apps/zh-hant/...`, `/open-source/zh-hant`). The tests enforce it.
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
- Products own their card as `publisher/card.json` in their own repository;
  `.github/workflows/sync-cards.yml` copies it here. Never hand-edit a card
  that has a source: change it in the product repository. Every text field
  needs `en` and `zh-Hant`. No product name appears in `src/` or `scripts/`
  (a test greps for it); product names are data in `content/`.

## Post-deploy check

After a deploy, `https://sylphx.com/apps`, `/apps/index.json`, `/open-source` and
both `zh-hant` twins answer 200 and list the expected cards, every card `url`
answers 200, and one app's `/apps/{app}/privacy` answers 200.

Deploy and CI details: README.
