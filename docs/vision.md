# publisher-pages vision

## Destination

Every app Sylphx publishes has a public home at `sylphx.com/apps/{app}`: a
landing page, a privacy policy, terms of use and a support page, in English and Traditional
Chinese, plus the universal-link and app-link files its store builds need. The
`/apps` index presents them as "Built on Sylphx", and `/open-source` lists the
developer tools Sylphx maintains. The pages are linked from the sylphx.com
footer, never from the platform navigation.

A store-first app needs no domain of its own. An app that has its own website
gets a card that links out instead of duplicate pages.

## Boundaries

- The platform repository names no product. This site holds all product text
  and is mounted at its paths of `sylphx.com` by Sylphx Hosting and Network;
  the platform holds only generic route configuration.
- Apps keep their own names and never carry "Sylphx". Sylphx appears only as
  the publisher.
- Legal pages name Sylphx Limited, registered in England and Wales, as the
  publisher and data controller.
- Each app owns its content in its own repository; this repository renders it
  and fails the build on incomplete content.
- Brand files come from brand homes and are never redrawn here: an app's icon
  and theme from its `brand/` folder, the publisher's own look from the company
  brand home, SylphxAI/brand.
- Static pages, no client JavaScript, no tracking, no cookies. nginx sends a
  strict Content Security Policy (`script-src 'none'`, `style-src 'self'`,
  no `'unsafe-inline'`), so no page may carry an inline script or style.

## State

2026-09-27:

- The site builds and passes its checks in CI on our own runners. Pages ship
  no JavaScript and pass the strict CSP check.
- Served: nothing on `sylphx.com` yet (`/apps` returns 404). Deployment and
  the path mount are pending:
  - the Hosting project `sylphx-publisher-pages` is declared in
    SylphxAI/cloud#9147 (open) and is created after that deploys;
  - mounting it at paths of `sylphx.com` needs domain-level `paths`
    (SylphxAI/cloud#9128, open). The `[[environments.production.domains]]`
    block with the four paths waits as publisher-pages#3 (draft) and is
    queued only after #9128 is live: before that the platform reads the host
    as a catch-all next to its own and the release fails.
- `sylphx.com/open-source` is still served by the platform's own page. It is
  replaced by this site's page when the mount is live (SylphxAI/cloud#9146
  moves the footer links then).
- Apps listed: Number Grove. Its content is owned by number-grove-keel as
  `publisher/app.json` and copied here by pull request. `deepLinks` wait for
  the Sylphx store accounts.
- Tachyn is not listed until `tachyn.ai` is live; it will be an external card.
- Site move to Keel (owner#739, stage 1) starts after the mount is live.

2026-09-28:

- The publisher's own look now comes from the company brand home. SylphxAI/brand
  is vendored into `vendor/brand/` and pinned at `e5376cb` by
  `scripts/sync-brand.sh`, which records the commit and every file's sha256 in
  `vendor/brand/SOURCE`. The sheet aliases the home's roles instead of holding
  a palette, the header is the home's lockup in its light and dark cuts, the
  browser and home-screen icons are the home's favicon set, and the faces are
  the home's IBM Plex files, served from this site's origin through its own
  loader. `tests/brand.test.ts` fails on a vendored file that differs from its
  recorded hash, on an extra file in `vendor/brand/`, on a colour literal in
  this repository's own CSS, and on a page that points at a brand file the
  build does not serve.
- One gap remains: Number Grove's `theme` in
  `content/apps/number-grove.json` — its dark set and the light `tag` and
  `highlight` tints — has no brand home to come from. Its other values are the
  title's own, and the title keeps them as float RGB in
  `crates/number-grove/src/theme.rs` rather than in a `brand/` folder, so there
  is no `brand/tokens.json` to read them from (checked 2026-09-28). Its
  `icon.svg` is a byte copy of that repository's
  `docs/design/brand/app-icon.svg`. The colours stay as they are until the
  title has a brand home.
