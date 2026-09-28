![publisher-pages](https://mark.sylphx.com/api/v1/mark/hero.svg?type=minimal&color=0%3A1f5e4b%2C50%3Ae8f0ec%2C100%3Afbfaf7&text=publisher-pages&desc=The%20Sylphx%20publisher%20pages%20on%20sylphx.com)

# publisher-pages

The Sylphx publisher pages on `sylphx.com`: the "Built on Sylphx" apps index,
one landing, privacy, terms and support page per app, the open-source tools list, and
the universal-link and app-link files. Owner decision:
[SylphxAI/owner company/decisions.md, 2026-09-26 "Publisher pages, and when a product gets a domain"](https://github.com/SylphxAI/owner/blob/main/company/decisions.md).

- Not served yet: <https://sylphx.com/apps> returns 404 and `/open-source` is still the platform's own page until the path mount below is live (see [docs/vision.md](docs/vision.md#state)).
- Vision: [docs/vision.md](docs/vision.md)

## What it serves

| Path on sylphx.com | Page |
|---|---|
| `/apps` | Index, "Built on Sylphx" |
| `/apps/{app}` | App landing page |
| `/apps/{app}/privacy`, `/apps/{app}/terms`, `/apps/{app}/support` | Privacy policy, terms of use and support page |
| `/open-source` | anymd, repomap, lockdocs, Mark, Firestore ODM, and the platform's SDK and CLI |
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
- `icon` and `theme` come from the app's brand home, the `brand/` folder in
  its own repository (owner `standards/experience.md`, "Brand home"): the icon
  is a byte-for-byte copy of the app's app-icon master, and the theme colours
  are values from its `brand/tokens.json`. Never redraw an icon or pick a
  colour here. Number Grove's `icon.svg` is its
  `brand/svg/number-grove-app-icon.svg` (same SHA-256) and its light palette
  is that home's values; the colours that home does not hold yet are listed
  in [docs/vision.md](docs/vision.md#state).
- The privacy page adds the publisher, rights and contact sections from
  [content/publisher.json](content/publisher.json); the app supplies only what
  it does with data.
- The terms of use are shared by every app: [src/terms.ts](src/terms.ts),
  drafted to owner `standards/commercial.md` "Legal surface" (owner#779).

## Commands

```bash
bun install          # bootstrap
bun run build        # write dist/
bun run check        # lint, type check, tests
```

CI runs `bun run check` and the build on GitHub's free standard hosted runners
(`ubuntu-latest`), which a public repository may use; the merge queue requires
the single `ci-ok` check. An `identifiers` job checks the lines a pull request
or merge group adds for id generators and primary keys that are not UUIDv7
(owner `standards/identifiers.md`).

`Dockerfile` builds the pages and serves `dist/` with nginx on port 8080;
`sylphx.toml` deploys it on Sylphx Hosting.

`nginx.conf` sends a strict Content Security Policy on every response:
`default-src 'none'; script-src 'none'; style-src 'self'`, images from the
site and from Mark, fonts from the site, and no `'unsafe-inline'` or
`'unsafe-eval'`. Pages therefore carry no inline script, `<style>`, `style=`
attribute or event handler; `bun run check` fails if one appears or if a page
loads an image from an origin the policy does not list.

## The publisher's look

The publisher's own look is not drawn here: it is the company brand home,
[SylphxAI/brand](https://github.com/SylphxAI/brand), copied in byte for byte.
Nothing in this repository redraws a logo, re-letters the name or picks a
colour (owner `standards/experience.md`, "Brand home").

- `scripts/sync-brand.sh <brand checkout>` copies the token sheet, the font
  loader with its IBM Plex files, the two header lockups and the browser icons
  into `vendor/brand/`, then writes `vendor/brand/SOURCE`: the commit it copied
  from and each file's sha256. The copy is pinned at SylphxAI/brand `e5376cb`.
  Run the script in the pull request that needs new brand files; **never edit
  `vendor/brand/` by hand**, and never add a brand file that the home does not
  have.
- `src/site.css` names no colour and no face of its own: `:root` points the
  site's names at the home's roles (`--bg: var(--sx-background)`,
  `--fg: var(--sx-text)`, `--accent: var(--sx-accent)`, …), so the palette is
  the home's by construction. An app's `theme.css` overrides those same names
  for its own pages.
- Pages load one stylesheet, `/apps/_assets/site.css`: the home's tokens, then
  its font loader, then this site's sheet. These pages are mounted at paths of
  `sylphx.com` and not at a host root, so the loader's `/fonts/…` urls are
  pointed at `/apps/_assets/brand/fonts/…` at build time; that substitution is
  the whole difference from the vendored file, and `tests/brand.test.ts`
  checks it is the only one.
- The header is the home's lockup: `sylphx-lockup-colour.svg`, with
  `sylphx-lockup-colour-on-dark.svg` as a `<picture>` source for
  `prefers-color-scheme: dark` — a media source rather than a CSS switch,
  because an inline style would break the CSP. It is 26 px high (103 px wide,
  above the home's 88 px minimum), and its alt text is "Sylphx".
- `tests/brand.test.ts` fails if a vendored file differs from its recorded
  sha256, if `vendor/brand/` holds anything besides the recorded files, if a
  colour literal appears in this repository's own CSS, if the sheet loads a
  face from another origin, or if a page points at a brand file the build does
  not serve.

## Open-source list

`content/open-source.json` is worded by the OSS lane. Each GitHub project shows
its star count as a badge from Mark (`https://mark.sylphx.com/github/stars/{owner}/{repo}`),
loaded by the browser in a fixed 110×20 box; set `"stars": false` to hide it.
