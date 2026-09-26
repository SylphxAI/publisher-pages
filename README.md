![publisher-pages](https://mark.sylphx.com/api/v1/mark/hero.svg?type=minimal&color=0%3A1f5e4b%2C50%3Ae8f0ec%2C100%3Afbfaf7&text=publisher-pages&desc=The%20Sylphx%20publisher%20pages%20on%20sylphx.com)

# publisher-pages

The Sylphx publisher pages on `sylphx.com`: the "Built on Sylphx" apps index,
one landing, privacy and support page per app, the open-source tools list, and
the universal-link and app-link files. Owner decision:
[SylphxAI/owner company/decisions.md, 2026-09-26 "Publisher pages, and when a product gets a domain"](https://github.com/SylphxAI/owner/blob/main/company/decisions.md).

- Live: <https://sylphx.com/apps> and <https://sylphx.com/open-source>, once the path mount below is served (see [docs/vision.md](docs/vision.md#state)).
- Vision: [docs/vision.md](docs/vision.md)

## What it serves

| Path on sylphx.com | Page |
|---|---|
| `/apps` | Index, "Built on Sylphx" |
| `/apps/{app}` | App landing page |
| `/apps/{app}/privacy`, `/apps/{app}/support` | Privacy policy and support page |
| `/open-source` | anymd, repomap, lockdocs, Firestore ODM, and the platform's SDK and CLI |
| `/apps/zh-hant/…`, `/open-source/zh-hant` | The same pages in Traditional Chinese |
| `/.well-known/apple-app-site-association`, `/.well-known/assetlinks.json` | Universal Links and Android App Links for the app paths |

The site is a separate Sylphx Hosting project mounted at exactly four paths of
`sylphx.com`: `/apps`, `/open-source`, `/.well-known/apple-app-site-association`
and `/.well-known/assetlinks.json`. Everything else on the host, including
`/zh-hant` and the rest of `/.well-known`, belongs to the platform site. The
platform repository (`SylphxAI/cloud`) names no product, so all product text
lives here. Every URL the pages use stays inside the mounted paths: language
twins sit under each prefix, and the stylesheet is at `/apps/_assets/site.css`.
The app slugs `zh-hant` and `_assets` are reserved.

## Adding or changing an app

Each app owns its content as one JSON file, `publisher/app.json` in the app's
own repository, in the format of [content/apps/number-grove.json](content/apps/number-grove.json)
and the `AppContent` type in [src/content.ts](src/content.ts). This repository
keeps a copy at `content/apps/{slug}.json`; copy the app's file here in a pull
request when it changes.

- Every text field has `en` and `zh-Hant`. The build fails on a missing one.
- An app with its own website sets `external` to that URL: it gets a card on
  `/apps` that links out, and no pages here.
- `deepLinks.apple.appIds` (`TEAMID.bundle.id`) and `deepLinks.android`
  (package name and signing-certificate SHA-256 fingerprints) generate the
  app-link files. Apple paths default to `/apps/{slug}/*`.
- Optional, for a fuller landing page: `theme` (the app's own colours for
  light and dark, as `#rrggbb` for the shared sheet's custom properties,
  served as `/apps/_assets/{slug}/theme.css`),
  `icon`, `hero` and `screenshots` (image files kept in
  `content/apps/{slug}/`, one per language, served from
  `/apps/_assets/{slug}/`), `sections` (`steps`, `cards` or `list`),
  `featuresHeading` and `plans`. A page with `sections` uses the wide layout
  and shows the support FAQ. The build fails on a missing image file.
- The privacy page adds the publisher, rights and contact sections from
  [content/publisher.json](content/publisher.json); the app supplies only what
  it does with data.

## Commands

```bash
bun install          # bootstrap
bun run build        # write dist/
bun run check        # lint, type check, tests
```

`Dockerfile` builds the pages and serves `dist/` with nginx on port 8080;
`sylphx.toml` deploys it on Sylphx Hosting.

`nginx.conf` sends a strict Content Security Policy on every response:
`default-src 'none'; script-src 'none'; style-src 'self'`, images from the
site and from Mark, and no `'unsafe-inline'` or `'unsafe-eval'`. Pages
therefore carry no inline script, `<style>`, `style=` attribute or event
handler; `bun run check` fails if one appears or if a page loads an image
from an origin the policy does not list.

## Open-source list

`content/open-source.json` is worded by the OSS lane. Each GitHub project shows
its star count as a badge from Mark (`https://mark.sylphx.com/github/stars/{owner}/{repo}`),
loaded by the browser in a fixed 110×20 box; set `"stars": false` to hide it.
