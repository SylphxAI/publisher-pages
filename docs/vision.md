# publisher-pages vision

## Destination

Every app Sylphx publishes has a public home at `sylphx.com/apps/{app}`: a
landing page, a privacy policy and a support page, in English and Traditional
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
- Static pages, no client JavaScript, no tracking, no cookies. nginx sends a
  strict Content Security Policy (`script-src 'none'`, `style-src 'self'`,
  no `'unsafe-inline'`), so no page may carry an inline script or style.

## State

2026-09-26:

- The site builds and passes its checks.
- Deployment and the path mount are pending:
  - the Hosting project `sylphx-publisher-pages` is declared in
    SylphxAI/cloud#9147 and is created after that deploys;
  - mounting it at paths of `sylphx.com` needs domain-level `paths`
    (SylphxAI/cloud#9128). The `[[environments.production.domains]]` block
    with the four paths is added to `sylphx.toml` only after #9128 is live:
    before that the platform reads the host as a catch-all next to its own
    and the release fails. Until then no page is served on `sylphx.com`.
- `sylphx.com/open-source` is still served by the platform's own page. It is
  replaced by this site's page when the mount is live.
- Number Grove's content is a seed written here; its repository takes it over.
- Tachyn is not listed until `tachyn.ai` is live; it will be an external card.
