# publisher-pages vision

## Goal

Every app Sylphx publishes has a public home at `sylphx.com/apps/{app}`: a
landing page, privacy policy, terms of use and support page, in English and
Traditional Chinese, plus the universal-link and app-link files its store
builds need. The `/apps` index presents them as "Built on Sylphx" and is linked
from the sylphx.com footer, not the platform navigation.

Why: stores require public legal and support URLs, and a store-first app should
not need a domain of its own. An app that has its own website gets a card that
links out instead of duplicate pages.

## Who it serves

App users and store reviewers (readable, correct legal and support pages), and
app teams (one JSON file in their repository produces all their pages).

## Boundaries and reasons

- The platform repository names no product, so all product text lives here and
  the platform holds only generic route configuration.
- Apps keep their own names and never carry "Sylphx"; Sylphx appears only as
  publisher, because apps are their own brands.
- Legal pages name Sylphx Limited, registered in England and Wales, as
  publisher and data controller.
- Each app owns its content in its own repository; this repository renders it
  and fails the build on incomplete content.
- Brand files come from brand homes and are never redrawn here, so one source
  defines each look.
- Static pages, no client JavaScript, no tracking, no cookies: legal pages need
  none, and a strict Content Security Policy keeps them that way.
- Only products Sylphx builds and runs are listed; partner, client and
  separate-publisher products are excluded (see the README).

## How success is judged

- `/apps`, `/apps/index.json` and every listed app's four pages return 200 in
  both languages after each deploy.
- The build fails, rather than ships, on missing translations, images or
  incomplete content.
- Store review finds no missing or broken privacy, terms or support link, and
  app-link files validate for each published app.
- `bun run check` passes in CI on every change.
