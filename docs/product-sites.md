# Product sites: one project and one site per product

Status: plan, 2026-10-03. Owner: this repository, because it already owns how
Sylphx publishes its products on our domain and the product list every site
links to (`/apps/index.json`). The platform repository (`SylphxAI/cloud`) names
no product, so its part is listed as generic gaps below.

## The decision

Each open-source product Sylphx sells (anymd, lockdocs, repomap, Google Photos
Delete Tool) gets **one Sylphx project and one site**, on our own platform and
our own domain:

- **Host:** `{product}.sylphx.com`, like `mark.sylphx.com`. Each site is its own
  origin, so one product's sign-in never shares storage with another's.
- **Engine:** keel-web. Docs come from the product's own `docs/` folder through
  `keel docs build`; the other pages are keel-web pages. The pack is static and
  is served by the project's `web` service on Sylphx Hosting, the way `kylet.se`
  is built and served today.
- **Back end:** none of its own. Sign-in is Sylphx Auth (the hosted Account
  Portal, code + PKCE, Google and GitHub). Buying is Sylphx Money (Stripe-hosted
  checkout with the consent tick). The buyer's licences, invoices, payment
  method and plan live in their account, through Money's customer portal.
  Receipts go out through Notify.
- **GitHub stays the code home.** The README's first link is the site; the old
  `sylphxai.github.io/{product}` pages point to the new host.

When every product sells from its own site, the shared `oss-checkout` service
(`buy.sylphx.com`) retires.

## What each site has

Few words, one idea per screen, written like a person would say it.

| Route | One idea | What is on it |
| --- | --- | --- |
| `/` | What it does for you | One sentence, the install command with a copy button, one "Get Pro" button |
| `/docs/...` | How to use it | The product's `docs/` rendered as pages; sidebar, contents, edit link |
| `/pricing` | What it costs | One card per plan (two at most), the price including tax, one Buy button each |
| `/buy?plan=` | Pay | Sends a signed-out visitor to sign in first, then to Money checkout; back to `/account` |
| `/account` | Your licence | The licence with a copy button and the exact activate command; "Manage billing" opens the Money portal (invoices, card, plan change, cancel) |
| Footer | The rest of what we make | The other products from `sylphx.com/apps/index.json`, the publisher line, links to privacy, terms and support |

A command-line tool gets its licence with `{product} pro login`: Auth's device
flow signs the user in, and the tool fetches that user's licence from Money and
keeps verifying it offline, as today.

Privacy, terms and support stay at `sylphx.com/apps/{product}/...`, rendered by
this repository from the product's `publisher/app.json`, so legal wording keeps
one owner.

## Platform versus product

| Shared (generic, no product names) | Per product (in its own repository) |
| --- | --- |
| Hosting: static pack on a `web` service, the domain from `sylphx.toml` | `sylphx.toml`: project, domain, the Auth and Money bindings |
| Auth: one instance per project, Account Portal branding, device flow | Brand: icon and colours from its `brand/` home |
| Money: catalog, checkout, portal, licence tokens, receipts | Plans: Money catalog lookup keys, prices, licence policy |
| keel-web and `keel docs build` | Copy: tagline, activate command, `docs/` |
| This repository: the product list and the legal pages | Its Stripe merchant account, connected to its own Money environment |

The shared site parts (header, footer, pricing card, account page) start inside
the first product's `site/` folder. When the second product moves, they are
lifted into one crate that every site depends on, so there is never a second
copy to keep in step.

## What the platform still lacks

1. **Money takes the signed-in user's token.** With a publishable key and the
   user's Auth token, Money creates a checkout session, a portal session, and
   lists that user's own licence tokens, for that user only and for catalog
   prices only (`end-user-principal.md` Stage 1, as Money's own spec already
   says). Without it a static site would need a server.
2. **Licence tokens on main.** They are in cloud#12080, not yet merged.
3. **Consent on the hosted checkout and the receipt.** cloud#12181 and
   cloud#12320 are in flight; nothing new is needed.
4. **Moving earlier buyers.** Money imports a paid order from another
   environment as a licence for a subject in this one (idempotent by the source
   order, audited), so an `oss-checkout` buyer's purchase moves into the
   product's own environment and account.

Search in `keel docs build` is not built yet; the first site ships without it.

## Moving each product

Order: anymd first (docs-heavy, a command-line tool, no paid orders yet), then
lockdocs and repomap on the shared crate, then Google Photos Delete Tool last,
after its Pro is live on the current path and its ads landing is measured.

| Product | Today | Steps |
| --- | --- | --- |
| anymd | VitePress on GitHub Pages; Buy on `buy.sylphx.com` | Slice 1, then slice 2 (below) |
| lockdocs | GitHub Pages | The same two slices on the shared crate |
| repomap | GitHub Pages; Team plan | The same; Team seats use Money's seat quantity |
| Google Photos Delete Tool | Landing on GitHub Pages with ads tracking; Buy on `buy.sylphx.com` | The same, plus: the purchase event moves to `/account?paid=1` with the checkout id as the transaction id; paid `oss-checkout` orders are imported (gap 4) and each buyer is emailed that their licence is now in their account |
| oss-checkout | Shared buy service | Once all four sell from their sites and every paid order is imported: `/buy/{product}` answers 301 to `{product}.sylphx.com/pricing`; the consent records are kept for their six years; then the service retires |

Every licence already sold keeps working throughout: tokens are verified
offline and never expire early.

## The first slice (anymd)

1. **Slice 1, no new platform work:** the keel-web site at `anymd.sylphx.com`
   with `/`, `/docs`, `/pricing` and the footer. Its Buy button still goes to
   `buy.sylphx.com/buy/anymd`. The GitHub Pages site points to the new host
   (canonical link and redirect); the README links the site.
2. **Slice 2, after gap 1:** sign-in, `/account`, Buy through Money, and
   `anymd pro login`.

## Rejected

- **Keep the shared checkout service.** Every new product then needs a code
  change in a service it does not own, and the buyer has no account to come
  back to: recovery runs through email links.
- **One shared site for every tool.** Docs readers search per product, stars
  accrue per repository, and each product has its own Stripe account.
- **A small server per site.** Four services to run and secure for what Money
  and Auth can serve directly once gap 1 lands.
- **Pages on `sylphx.com/{product}`.** Every product would share one origin
  with the platform site and with each other.

## Rollback

Each slice is reversible on its own: the GitHub Pages site and `buy.sylphx.com`
keep running until the product's slice 2 has read back a real purchase, so a
bad deploy is fixed by pointing the README and the Buy button back.

## How we know it works

- The site's checks: every page answers 200, no sideways scroll at 360, 390
  and 1440 px, axe clean, no broken docs link (`keel check`, `keel docs build`).
- Money: a contract test that a user's token can create a checkout or portal
  session and list licences for that user only, and is refused for another
  subject or an inline price.
- Read back in production: a new user signs in, buys, sees the licence on
  `/account`, activates it in the tool, opens the portal and sees the invoice;
  `{product} pro login` returns the same licence.
