# Product sites: one project and one site per product

Status: current contract checked **2026-11-03, 17:53 UTC**. Product sites own
new purchases; `buy.sylphx.com` is closed to new orders but still serves
historical delivery and recovery. **The service is not retired.**

This repository owns the publisher hub, `/apps/index.json` and publisher
pages. Products own their sites and copy in their own repositories. The
platform repository (`SylphxAI/cloud`) supplies generic capabilities, not
product-specific pages or checkout rules.

## What is live

The current public sites are on GitHub Pages, not verified custom domains.
All eight pricing and recovery URLs below returned HTTP `200` in a GET-only
read on 2026-11-03 at 17:53:14 UTC.

| Product | Pricing | Recovery | Current offer |
| --- | --- | --- | --- |
| anymd | [Pricing](https://sylphxai.github.io/anymd/pricing) | [Recover](https://sylphxai.github.io/anymd/recover) | Paid Pro through the shared Keel Money component |
| Google Photos Delete Tool | [Pricing](https://sylphxai.github.io/Google-Photos-Delete-Tool/pricing) | [Recover](https://sylphxai.github.io/Google-Photos-Delete-Tool/recover) | Paid Pro through the shared Keel Money component |
| lockdocs | [Pricing](https://sylphxai.github.io/lockdocs/pricing) | [Recover](https://sylphxai.github.io/lockdocs/recover) | Paid Pro seat packs through the shared Keel Money component |
| repomap | [Pricing](https://sylphxai.github.io/repomap/pricing) | [Recover](https://sylphxai.github.io/repomap/recover) | Recovery only; current capabilities, including multi-repository workspaces, are free |

These are Keel-generated static storefronts. The three paid pricing pages
load the shared Keel Money browser component and call `https://api.sylphx.com`
directly; repomap loads the recovery-only component. New purchases do not go
through the central checkout adapter. The current paid flow uses email,
Stripe-hosted checkout and offline-verifiable licence tokens; it does not
require the proposed sign-in and `/account` flow below.

Payment qualification is recorded separately in
[owner#1722](https://github.com/SylphxAI/owner/pull/1722), merged 2026-11-02:
simulated Stripe TEST payments exercised fulfilment and client licence/expiry
checks; production checks created unpaid LIVE Checkout Sessions and stopped
before card entry. That report names its limits, including the unverified
vendor-signed duplicate webhook delivery. The GET read above is a surface
check, not a new payment or historical-recovery test.

## The central checkout contract

[oss-checkout#29](https://github.com/SylphxAI/oss-checkout/pull/29), merged
2026-11-02 as `e19aaf15b68b64e6ffed9a1cec9db72314f5c45a`, closed new orders
for all four catalog entries. The later aggregate-report release,
[oss-checkout#30](https://github.com/SylphxAI/oss-checkout/pull/30), merged
2026-11-03 as `b6972919fc2bb2c2ec6ee69da212fd250536c3ea`, was serving
`/health` with HTTP `200` and that `x-sylphx-revision-sha` at 17:53:48 UTC.

- Known `GET` and form `POST /buy/{product}` requests return HTTP `400`,
  **not `301`**, with a direct product storefront link and a legacy
  `/recover?product=<slug>` link. They do not forward old claim, email, pack or
  quantity values, create an order, or show a new consent form. The anymd GET
  response was also read back as `400` at 17:53:48 UTC; POST behavior is the
  merged source/test contract, not a POST made for this documentation update.
- New `POST /api/v1/claims` requests are refused with `400 invalid_order`.
  Already-bound claim polling remains available for existing orders.
- Browser-bound `/return`, signed `/licence`, legacy `/recover` and
  scheduler-signed `/sweep` remain in service, including for historical repomap
  Team orders. Signed recovery links do not start another checkout.
- The closure preserves PostgreSQL order/recovery data, the buyer-email HMAC
  mapping to opaque buyer IDs, signing keys, existing Money catalog records,
  licence terms and retention rules. Catalog setup sends nothing when every
  product is closed. There is no data deletion or entitlement re-grant.

The detailed contract, tests and census procedure live in
[oss-checkout's retirement record](https://github.com/SylphxAI/oss-checkout/blob/main/docs/central-checkout-retirement.md).
Do not restore central Buy links as a site rollback: the central order and
new-claim routes are deliberately closed. Repair or roll back the affected
product storefront while keeping historical delivery and recovery available.

## What still prevents final retirement

A working storefront does not prove that an earlier buyer can recover a
licence. The legacy adapter sends opaque `b_...` buyer subjects to Money and
keeps its own email-HMAC bridge; it does not send `buyer_email` with the old
checkout request.

Money's email recovery matches an unexpired paid term within one exact
organization, project and environment, using either the email subject or the
paid checkout's `buyer_email`. It cannot discover those opaque legacy subjects
without a supported recovery-contact migration and explicit routing to the
legacy parent. A non-enumerating `202` recovery acknowledgement proves
neither a matching purchase nor email delivery. See the
[Money recovery query](https://github.com/SylphxAI/cloud/blob/ceb6cd4673ca31bc8b9517d3a4baaf44d148c009/services/money/crates/money-api/src/web_client.rs#L846-L881),
read on 2026-11-03, and the adapter's retirement record.

Final retirement remains unproved until both evidence sets are complete:

1. **Authoritative order census.** Read the adapter's aggregate retained-row
   reports and Money's exact-parent lifetime paid/pending-order and licence
   recovery-contact census. The adapter report release is serving, but its
   deployment is not a census result.
   [cloud#15814](https://github.com/SylphxAI/cloud/pull/15814), which adds the
   scoped Money census, was still open when read at 17:53 UTC. Local delivery
   stamps, zero retained rows or a revenue projection cannot establish that
   no historical paid orders exist.
2. **Historical recovery and fulfilment continuity.** Reconcile pending orders
   and prove recovery for any paid legacy terms. If contact migration is
   needed, use Money's supported capability and the exact legacy parent;
   preserve the original paid source, product, plan, signature, seats and
   expiry. Do not recreate purchases or grant replacement entitlements merely
   to move them.

Until that evidence is read back, keep the adapter, PostgreSQL data,
buyer-HMAC bridge, signing keys and delivery schedule. No bulk import,
buyer-email migration, notification campaign, zero-paid-order conclusion or
service/database teardown is established by this document.

## Platform and product boundaries

| Shared platform capability | Product-owned configuration and content |
| --- | --- |
| Keel docs/site rendering and the shared Money browser component | `docs/`, storefront copy, activation instructions and brand assets |
| Money catalog, checkout, licence tokens and recovery | Exact Money parent, catalog lookup keys, plans, seat packs and licence policy |
| Auth, account and customer-portal capabilities where adopted | Site bindings, sign-in integration and account experience |
| Hosting and custom-domain support where adopted | `sylphx.toml`, project and domain declaration |
| This repository's publisher hub, product list and publisher pages | The app's authoritative `publisher/app.json`, copied here for rendering |

Reuse the shared component rather than building a checkout server per
product. Prices and licence policy come from Money; product copy stays in the
product repository. The publisher's own look comes from the vendored brand
home, as described in the [README](../README.md).

The old platform-gap list is not current status:

- Licence tokens landed in
  [cloud#12080](https://github.com/SylphxAI/cloud/pull/12080), merged 2026-10-05.
- Hosted-checkout consent landed in
  [cloud#12181](https://github.com/SylphxAI/cloud/pull/12181), merged 2026-10-26.
- The generic Notify purchase-receipt change,
  [cloud#12320](https://github.com/SylphxAI/cloud/pull/12320), was still open
  when read on 2026-11-03. A merged consent change or a storefront email promise
  does not establish that this separate change has shipped.
- Signed-in checkout, portal and licence-list access remain requirements for
  an account-based site, not prerequisites for the already-shipped email-based
  storefront. Their complete adoption is not verified here.

## Future domain and account work

The intended design remains one project and one site per product. Moving to
`{product}.sylphx.com` would give each site its own origin; the current GitHub
Pages paths do not provide that origin isolation. Hosting on our platform,
custom-domain readiness, canonical links and GitHub Pages redirects need their
own readback. Do not send buyers to an unverified hostname or describe this
move as complete.

For that future account-based site, preserve these requirements:

| Surface | Required behavior, not a claim about today's routes |
| --- | --- |
| `/` and `/docs/...` | Explain the product, show installation and render the product's own docs with working navigation and edit links |
| `/pricing` | Show current Money catalog prices, tax treatment, plans and seat quantities |
| Buy and `/account` | Use Auth and Money directly; show only the signed-in buyer's licences and exact activation instructions; open the Money customer portal for billing |
| CLI account login | Use Auth's device flow and Money's public licence path; keep local offline verification and existing activation working |
| Footer | Link the publisher product list and the appropriate privacy, terms and support pages |

Account APIs must scope checkout, portal sessions and licence listing to the
requesting subject and catalog prices, refusing other subjects and inline
prices. Sites need working docs links, accessible controls and no sideways
scroll at 360, 390 and 1440 px. Test payment, webhook, grant and expiry
end-to-end in Stripe Test Mode; production acceptance checks public prices,
configuration and unpaid LIVE Checkout creation, without real-card submission.
Neither a custom-domain move nor an account page substitutes for the legacy
recovery proof required before final retirement.
