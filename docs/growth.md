# Publisher pages growth

## Useful result

A visitor can find an app, understand what it does and reach its own site or
store. An app user or store reviewer can reach the correct privacy, terms and
support pages without requiring a separate domain. This is a discovery and
trust surface, not a subscription product or a place to build a return habit.
The scope is [vision.md](vision.md), and its completion oracles are in
[capabilities.md](capabilities.md).

## Existing discovery loop

1. A product owns its bilingual `publisher/app.json`; this repository keeps
   the reviewed copy and renders its pages or external-site card.
2. Once it meets the README's listing rules, it appears on `/apps` and in
   `/apps/index.json`. The platform home consumes that generic index; its
   footer links to the hub.
3. A visitor follows the app's own name and description to its landing or
   external site. The product owns the next useful result, installation,
   activation, retention and purchase.
4. Product teams update the source content when the product changes and copy
   it here, keeping discovery, legal and support information consistent.

Eligibility is not a promotion lever: never list a product before its public
landing is verified, or include partner, client or separate-publisher products.
Product brands stay their own. Do not publish user counts, ratings, prices or
performance claims without their source; no such growth claim is established
by this document.

## Measurement and decisions

No traffic or conversion baseline has been measured for this document. The
following are target metrics, not reported results or promises:

| Question | Metric and evidence | Decision it informs |
| --- | --- | --- |
| Can visitors reach the promised pages? | Successful responses for the hub, JSON index and local app pages in both languages, from the documented deploy readback | Fix broken publication before expanding discovery |
| Does discovery lead to useful product use? | Product-owned activation attributable to a publisher referral, where the product already records that source | Improve the originating app's description when referrals do not lead to its useful result |
| Do users find the legal and support information they need? | Product support cases about missing, broken or unclear publisher links, from the product's support records | Correct the product-owned content or the shared rendering, according to which owns the defect |

Page views and clicks alone do not establish activation, retention or revenue.
Any conversion figure must name its observation period, denominator and source;
without attribution, mark the publisher's contribution unverified. Purchases,
net retention and support costs are measured by the products that own them,
not inferred from this hub.

## Boundaries

Keep the site's existing static, no-tracking, no-cookie model. Do not add
client analytics, accounts, checkout, notifications, paid campaigns or a
publisher-specific retention mechanism to measure this loop. A new measurement
capability is separate work using the platform's generic service, not an
implementation hidden in these docs. Paid promotion belongs to the launched
product and its authorized budget, not this shared legal and discovery surface.

The company [growth standard](https://github.com/SylphxAI/owner/blob/main/standards/growth.md)
governs claims, promotion and useful-result metrics. This document records the
existing discovery path; it introduces no new growth mechanic or experiment.
