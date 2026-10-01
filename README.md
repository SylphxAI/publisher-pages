![publisher-pages](https://mark.sylphx.com/api/v1/mark/hero.svg?type=minimal&color=0%3A1f5e4b%2C50%3Ae8f0ec%2C100%3Afbfaf7&text=publisher-pages&desc=The%20Sylphx%20publisher%20pages%20on%20sylphx.com)

# publisher-pages

The Sylphx publisher pages on `sylphx.com`: the "Built on Sylphx" apps gallery,
the open-source gallery, one landing, privacy, terms and support page per app, and
the universal-link and app-link files. Owner decision:
[SylphxAI/owner company/decisions.md, 2026-09-26 "Publisher pages, and when a product gets a domain"](https://github.com/SylphxAI/owner/blob/main/company/decisions.md).

- Vision: [docs/vision.md](docs/vision.md)

## What it serves

| Path on sylphx.com | Page |
|---|---|
| `/apps` | Hub, "Built on Sylphx": an image card per product that runs on Sylphx, with status and service chips |
| `/open-source` | Hub of the open-source tools Sylphx publishes: image cards with licence, GitHub link and star badge, then the platform's SDK and CLI packages |
| `/apps/index.json` | The same list as `[{slug, name, url, summary, services}]`, cached one hour; sylphx.com's home page reads it |
| `/apps/{app}` | App landing page |
| `/apps/{app}/privacy`, `/apps/{app}/terms`, `/apps/{app}/support` | Privacy policy, terms of use and support page |
| `/apps/zh-hant/…`, `/open-source/zh-hant` | The same pages in Traditional Chinese |
| `/.well-known/apple-app-site-association`, `/.well-known/assetlinks.json` | Universal Links and Android App Links for the app paths |

The site is a separate Sylphx Hosting project mounted at four paths of
`sylphx.com`: `/apps`, `/open-source`, `/.well-known/apple-app-site-association`
and `/.well-known/assetlinks.json` (the `domains` block in `sylphx.toml`; it takes
effect once the platform admits path-scoped domains on the apex host). Everything
else on the host, including `/zh-hant` and the rest of `/.well-known`, belongs to
the platform site. The platform repository (`SylphxAI/cloud`) names no product,
so all product text lives here. Every URL the pages use stays inside the mounted
paths or is a platform page the shell links to (`PLATFORM_PATHS` in `src/render.ts`):
language twins sit under each prefix, and the stylesheet and every image are under
`/apps/_assets/`. The app slugs `zh-hant` and `_assets` are reserved.

## The hubs

A product is listed by its **card**: `publisher/card.json` in the product's own
repository, copied here to `content/cards/{slug}/` by the sync below. A card
with `services` (the Sylphx services it runs on) is listed on `/apps` and in
`/apps/index.json`; a card of `kind: "open-source"` is listed on `/open-source`.
A card can be on both (one record, both hubs). No product name is in `src/`:
`tests/hub.test.ts` fails if one appears.

Who may be listed (owner rule, 2026-09-29): only products Sylphx builds and
runs. Never list:

- a Hypothesis-Idea product (a partner company, not ours);
- `SylphxAI/bgca` (a client project);
- a Cubeage title (Cubeage is a separate Hong Kong publisher, and Cubeage
  products carry no Sylphx branding).

`content/sources.json` is the listing gate: one line per product
(`{ "slug", "repo", "ref" }`), approved by Services in a pull request.

Number Grove keeps its landing, privacy, terms and support pages but has no
card and no store link yet, so its pages carry `noindex` and no "coming soon"
text (an app without a store link is not indexed).

## Adding or changing an app

**Owners edit their own repository, never this one.** Each product keeps its
card in `publisher/` of its own repository:

```
publisher/card.json     the card (schema/card.schema.json)
publisher/card.webp     optional image: a real screenshot, 1200x750 webp, at most 60 KB
publisher/icon.svg      optional icon: a byte copy of the brand-home icon
```

```jsonc
{
  "slug": "example",                    // kebab-case, unique, not zh-hant or _assets
  "kind": "app",                        // or "open-source"
  "name":     { "en": "Example", "zh-Hant": "範例" },
  "tagline":  { "en": "One sentence.", "zh-Hant": "一句。" }, // at most 110 characters; no "coming soon", "soon", "beta", "waitlist", "launching"
  "category": { "en": "Productivity", "zh-Hant": "效率工具" }, // CARD_CATEGORIES in src/content.ts
  "url": "https://example.com",         // https; answers 200 at sync time
  "status": "available",                // or "early-access"; an unshipped product is not listed
  "image": { "src": "card.webp", "alt": { "en": "…", "zh-Hant": "…" } },
  "icon": "icon.svg",
  "services": ["Hosting", "Data"],      // listed on /apps when non-empty
  "repo": "SylphxAI/example",           // open-source only: public repository
  "licence": "MIT",                     // open-source only: equals the repository's SPDX licence
  "docs": "https://example.com/docs"
}
```

To list a new product: add its line to `content/sources.json` in a pull request
here (Services approves). From then on every change to its `publisher/` files
reaches the hubs with no pull request from the owner.

**The sync.** `.github/workflows/sync-cards.yml` runs hourly, on
`repository_dispatch` (type `card-changed`, optional `client_payload.slug`) and
by hand, on `ubuntu-latest` (free for this public repository). For every source
it reads `publisher/` with a read-only GitHub App token, validates the card
(`validateCard`: both languages, no unknown field, closed category list,
tagline rules, image size and weight), checks that `url` answers 200 on its own
site, and for open-source cards that the repository is public and its licence
matches GitHub's. A changed card gets its own pull request on
`sync/card-{slug}`, labelled `owner:services`, with auto-merge through the merge
queue. A failing card fails only itself: its last good copy stays live, and the
run turns red. `bun scripts/sync-cards.ts --dry-run` reads and checks without
writing. The workflow needs the repository secrets `CARD_SYNC_APP_ID` and
`CARD_SYNC_APP_KEY` of a GitHub App installed on every source repository
(contents and metadata read; contents and pull requests write only here).

`content/surfaces.json` lists the platform's own packages (SDK, contract, CLI)
shown under the open-source gallery.

Apps that also have landing pages here keep the rest in `content/apps/{slug}.json`
(the `AppContent` type in [src/content.ts](src/content.ts), the format of
[content/apps/number-grove.json](content/apps/number-grove.json)); their card
fields live in the card, not in that file.

- Every text field has `en` and `zh-Hant`. The build fails on a missing one.
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
  [content/publisher.json](content/publisher.json) (name, number, office,
  phone, `hi@sylphx.com`); the app supplies only what it does with data.
- The terms of use are shared by every app: [src/terms.ts](src/terms.ts),
  drafted to owner `standards/commercial.md` "Legal surface" (owner#779).
- Hub share images are `content/hub/{apps,open-source}-og.{en,zh}.webp`
  (1200x630), served from `/apps/_assets/hub/`.

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
