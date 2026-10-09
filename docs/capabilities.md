# Publisher pages capability graph

The identities of this repository, with one fate each. The destination is
[vision.md](vision.md); the routes and content contract are in the
[README](../README.md). `live` means an identity stays in the destination,
not that a deployment has been verified. **Done when** is a completion oracle,
not a claim of current production behavior.

| ID | Identity | Fate | Depends on | Done when |
| --- | --- | --- | --- | --- |
| `PUB-CONTENT` | Product-owned `publisher/app.json`, copied to `content/apps/{slug}.json`, with English and Traditional Chinese text | live | Product repositories | The build rejects incomplete content, missing translations and missing images; changes originate in the product's content file |
| `PUB-PAGES` | Landing, privacy, terms and support pages under `/apps/{app}` and `/apps/zh-hant/{app}` | live | `PUB-CONTENT`, `PUB-BRAND`, Sylphx Hosting and Network | Each local app's four pages answer 200 in both languages; an app with an external site links out without duplicate pages |
| `PUB-LEGAL` | Shared publisher details and terms, with product-owned privacy and support content | live | `PUB-CONTENT` | Legal and support URLs resolve for each published local app and name the publisher without replacing the app's own brand |
| `PUB-HUB` | The “Built on Sylphx” index at `/apps` and its Traditional Chinese twin | live | `PUB-CONTENT` | The index lists only eligible products Sylphx builds and runs, with declared services and a verified public landing; partner, client and separate-publisher products are excluded |
| `PUB-INDEX` | `/apps/index.json`: `slug`, `name`, `url`, `summary` and `services`, cached for one hour | live | `PUB-HUB` | The JSON and hub contain the same eligible apps in the same order; the platform consumes the list without owning product copy |
| `PUB-APP-LINKS` | Apple Universal Links and Android App Links association files | live | `PUB-CONTENT`, Sylphx Network | The two `/.well-known` files contain each configured app's identifiers, paths and certificate fingerprints and validate for its store build |
| `PUB-BRAND` | Vendored publisher brand files and product-owned icons and theme tokens | live | Brand homes | Publisher assets match `vendor/brand/SOURCE`; app icons and theme values come from the app's brand home, not a second design source |
| `PUB-STATIC` | Static build served by nginx, with no client JavaScript, tracking or cookies | live | `PUB-PAGES`, `PUB-HUB`, `PUB-APP-LINKS` | `bun run check` and `bun run build` pass; assets and language links stay within the mounted paths and pages meet the configured Content Security Policy |

## Ownership boundary

These are publisher-site capabilities, not the Kernel Publisher that compiles
Cell Snapshots. Product copy lives here and in the originating product
repositories, never in `SylphxAI/cloud`. Hosting and Network own deployment,
path mounting and delivery; this repository owns the static output. The
platform owns `/open-source` and every host path outside the three mounts
listed in the README.

Acquisition and measurement boundaries are in [growth.md](growth.md).
[product-sites.md](product-sites.md) is a plan for product-owned sites, not a
claim that this repository implements sign-in, checkout or licences.
