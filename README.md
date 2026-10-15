![publisher-pages](https://mark.sylphx.com/api/v1/mark/hero.svg?type=minimal&color=0%3A1f5e4b%2C50%3Ae8f0ec%2C100%3Afbfaf7&text=publisher-pages&desc=The%20Sylphx%20publisher%20pages%20on%20sylphx.com)

# publisher-pages

The Sylphx publisher pages on `sylphx.com`: the "Built on Sylphx" apps index,
one landing, privacy, terms and support page per app, and
the universal-link and app-link files. Owner decision:
[SylphxAI/owner company/decisions.md, 2026-09-26 "Publisher pages, and when a product gets a domain"](https://github.com/SylphxAI/owner/blob/main/company/decisions.md).

- Vision: [docs/vision.md](docs/vision.md)
- Capabilities and completion oracles: [docs/capabilities.md](docs/capabilities.md)
- Discovery loop and measurement boundaries: [docs/growth.md](docs/growth.md)
- Product sites, one project and one site per product: [docs/product-sites.md](docs/product-sites.md)

## What it serves

| Path on sylphx.com | Page |
|---|---|
| `/apps` | Hub, "Built on Sylphx": one card per app that runs on Sylphx |
| `/apps/index.json` | The same list as `[{slug, name, url, summary, services}]`, cached one hour; sylphx.com's home page reads it |
| `/apps/{app}` | App landing page |
| `/apps/{app}/privacy`, `/apps/{app}/terms`, `/apps/{app}/support` | Privacy policy, terms of use and support page |
| `/apps/zh-hant/…` | The same pages in Traditional Chinese |
| `/.well-known/apple-app-site-association`, `/.well-known/assetlinks.json` | Platform-served Universal Links and Android App Links; this repo supplies generated JSON |

The site is a separate Sylphx Hosting project mounted only at `/apps` on
`sylphx.com`, using the supported top-level `[[domains]]` declaration in
`sylphx.toml` (SylphxAI/cloud#9128). Deploy this declaration only after that
contract version is ready. Everything else on the host, including `/`,
`/open-source`, `/zh-hant` and `/.well-known`, belongs to the platform site.
This repository generates app-link JSON from app-owned public metadata for
handoff; the platform serves both app-link files, not this project's mount.
Missing Apple application identifiers or Play app-signing certificates must
never be guessed. Product text lives here. Every URL the pages use stays
inside `/apps`, apart from links to platform-owned pages: language
twins sit under each prefix, and the stylesheet is at `/apps/_assets/site.css`.
The app slugs `zh-hant` and `_assets` are reserved.

## The hub

An app is listed on `/apps` and in `/apps/index.json` when its JSON has
`services`: the Sylphx services it runs on, proven by the `sylphx.toml` in its
repository and a public URL that answers 200. An app with its own site sets
`external` and gets a card only; its name and one-liner (`tagline`) are its own,
never Sylphx-branded. An app without `services` is not listed.

Who may be listed (owner rule, 2026-09-29): only products Sylphx builds and
runs. Never list:

- a Hypothesis-Idea product (a partner company, not ours);
- `SylphxAI/bgca` (a client project);
- a Cubeage title (Cubeage is a separate Hong Kong publisher, and Cubeage
  products carry no Sylphx branding).

An app is listed only once its landing is live and its `sylphx.toml` declares
a service; Number Grove keeps its pages but is not listed until then.

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
  is that home's values. Its dark palette, `tag` and `highlight` tints are
  not in that home yet and are picked in `content/apps/number-grove.json`;
  replace them when the home holds them.
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
  from and each file's sha256.
  Run the script in the pull request that needs new brand files; **never edit
  `vendor/brand/` by hand**, and never add a brand file that the home does not
  have.
- `src/site.css` names no colour and no face of its own: `:root` points the
  site's names at the home's roles (`--bg: var(--sx-background)`,
  `--fg: var(--sx-text)`, `--accent: var(--sx-accent)`, …), so the palette is
  the home's by construction. An app's `theme.css` overrides those same names
  for its own pages.
- Pages link the home's own sheets as files, each served exactly as vendored:
  `/apps/_assets/brand/tokens/brand.css`, then
  `/apps/_assets/brand/fonts/fonts.css`, then this site's
  `/apps/_assets/site.css`. The font loader names its `.woff2` files relatively,
  so the faces travel beside it under `/apps/_assets/brand/fonts/` and load
  from this origin with no build-time rewrite.
- The header is the home's lockup: `sylphx-lockup-colour.svg`, with
  `sylphx-lockup-colour-on-dark.svg` as a `<picture>` source for
  `prefers-color-scheme: dark` — a media source rather than a CSS switch,
  because an inline style would break the CSP. It is 26 px high (103 px wide,
  above the home's 88 px minimum), and its alt text is "Sylphx".
- `tests/brand.test.ts` fails if a vendored file differs from its recorded
  sha256, if `vendor/brand/` holds anything besides the recorded files, if a
  colour literal appears in this repository's own CSS, if the served font
  loader is not byte for byte the home's or a face it names is missing beside
  it, or if a page points at a brand file the build does not serve.
