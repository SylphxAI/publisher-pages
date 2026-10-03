import { describe, expect, test } from 'bun:test'
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { loadSite, renderSite } from '../src/build'
import { CARD_CATEGORIES, PLATFORM_SERVICES } from '../src/content'
import { hubApps, openSourceCards, PLATFORM_PATHS } from '../src/render'

const site = await loadSite()
const files = await renderSite(site)
const zhFiles = files
const index = JSON.parse(files.get('apps/index.json') ?? 'null') as Array<Record<string, unknown>>
const hub = files.get('apps/index.html') ?? ''
const hubZh = zhFiles.get('apps/zh-hant/index.html') ?? ''
const oss = files.get('open-source/index.html') ?? ''
const ossZh = files.get('open-source/zh-hant/index.html') ?? ''
const listed = hubApps(site.cards)
const tools = openSourceCards(site.cards)

describe('/apps/index.json', () => {
	test('is a list of exactly slug, name, url, summary and services', () => {
		expect(Array.isArray(index)).toBe(true)
		expect(index.length).toBeGreaterThan(0)
		for (const entry of index) {
			expect(Object.keys(entry).sort()).toEqual(['name', 'services', 'slug', 'summary', 'url'])
			for (const key of ['slug', 'name', 'url', 'summary'] as const) {
				expect(typeof entry[key]).toBe('string')
				expect(entry[key]).not.toBe('')
			}
			expect(String(entry.url)).toMatch(/^https:\/\//)
			const services = entry.services as string[]
			expect(services.length).toBeGreaterThan(0)
			for (const service of services) expect(PLATFORM_SERVICES).toContain(service as never)
		}
	})

	test('has the same entries as the hub page, in the same order', () => {
		expect(index.map((e) => e.slug)).toEqual(listed.map((c) => c.slug))
		for (const entry of index) expect(hub).toContain(`href="${entry.url}"`)
	})

	test('slugs are unique', () => {
		expect(new Set(index.map((e) => e.slug)).size).toBe(index.length)
	})

	test('a card without services is not listed', () => {
		for (const card of site.cards.filter((c) => (c.services?.length ?? 0) === 0)) {
			expect(index.some((e) => e.slug === card.slug)).toBe(false)
		}
		expect(index.some((e) => e.slug === 'number-grove')).toBe(false)
	})

	test('nginx serves it as JSON with an hourly cache', () => {
		const conf = readFileSync(join(import.meta.dir, '../nginx.conf'), 'utf8')
		const block = conf.match(/location = \/apps\/index\.json \{[^}]*\}/)?.[0] ?? ''
		expect(block).toContain('application/json')
		expect(block).toContain('expires 1h')
	})
})

describe('apps hub page', () => {
	test('has the title, a data-driven standfirst and one tile per entry', () => {
		expect(hub).toContain('<h1>Built on Sylphx</h1>')
		expect(hub).toContain(`${index.length} products in production on Sylphx`)
		expect(hub.match(/<li class="tile" /g)?.length).toBe(index.length)
		for (const entry of index) expect(hub).toContain(String(entry.summary))
	})

	test('the grid is a responsive image-card grid inside a 1200px container', () => {
		const css = files.get('apps/_assets/site.css') ?? ''
		expect(css).toContain('max-width: 1200px')
		expect(css).toMatch(
			/\.tiles \{[^}]*grid-template-columns: repeat\(auto-fill, minmax\(min\(100%, 300px\), 1fr\)\)/,
		)
		expect(css).toMatch(/\.media \{[^}]*aspect-ratio: 16 \/ 10/)
	})

	test('each tile links the whole card, shows status and service chips, and cues external links', () => {
		for (const card of listed) {
			expect(hub).toContain(
				`<a href="${card.url}">${card.name.en}<span class="sr"> (opens ${new URL(card.url).hostname})</span></a>`,
			)
			for (const service of card.services ?? []) expect(hub).toContain(`>${service}</a>`)
		}
		expect(hub).toContain('class="tag early-access">Early access</span>')
		expect(hub).toContain('Get early access →')
		expect(hub).not.toMatch(/coming soon/i)
		expect(hub).toContain('href="/products/hosting">Hosting</a>')
		expect(hub).toContain('href="/products/database">Data</a>')
	})

	test('a tile has an image only when the card ships one, with size and lazy loading', () => {
		for (const card of listed) {
			if (card.image) {
				expect(hub).toMatch(
					new RegExp(
						`<img src="/apps/_assets/cards/${card.slug}/${card.image.src}"[^>]*width="1200" height="750"`,
					),
				)
			}
		}
		const lazy = hub.match(/loading="lazy"/g)?.length ?? 0
		expect(lazy).toBeGreaterThan(0)
	})

	test('has a CSS-only category filter with one radio per category in use', () => {
		const used = new Set(listed.map((c) => c.category.en))
		expect(hub).toContain('<fieldset class="filters">')
		expect(hub.match(/<input type="radio" name="category"/g)?.length).toBe(used.size + 1)
		const css = files.get('apps/_assets/site.css') ?? ''
		for (const i of CARD_CATEGORIES.keys()) {
			expect(css).toContain(`.hub:has(#cat-${i}:checked) .tile:not([data-cat="${i}"]){display:none}`)
		}
	})

	test('ends with the call to action to start building', () => {
		expect(hub).toContain('<h2>Build yours on Sylphx</h2>')
		expect(hub).toContain('<a class="button" href="/signup">Start building</a>')
		expect(hub).toContain('<a class="button ghost" href="/docs">Read the docs</a>')
	})

	test('carries a description, canonical, Open Graph and Twitter tags with a share image', () => {
		expect(hub).toContain('<link rel="canonical" href="https://sylphx.com/apps">')
		expect(hub).toMatch(/<meta name="description" content="[^"]{60,}">/)
		expect(hub).toContain('<title>Products built on Sylphx · Sylphx</title>')
		expect(hub).toContain('<meta property="og:url" content="https://sylphx.com/apps">')
		expect(hub).toContain(
			'<meta property="og:image" content="https://sylphx.com/apps/_assets/hub/apps-og.en.webp">',
		)
		expect(hub).toContain('<meta property="og:image:alt"')
		expect(hub).toContain('<meta name="twitter:card" content="summary_large_image">')
		for (const f of ['apps-og.en', 'apps-og.zh', 'open-source-og.en', 'open-source-og.zh']) {
			const dir = join(import.meta.dir, '../content/hub')
			expect(readdirSync(dir)).toContain(`${f}.webp`)
		}
	})

	test('carries an ItemList of SoftwareApplication as JSON-LD', () => {
		const raw = hub.match(/<script type="application\/ld\+json">([^<]*)<\/script>/)?.[1] ?? ''
		const data = JSON.parse(raw)
		expect(data['@type']).toBe('ItemList')
		expect(data.itemListElement).toHaveLength(index.length)
		for (const [i, el] of data.itemListElement.entries()) {
			expect(el.item['@type']).toBe('SoftwareApplication')
			expect(el.item.url).toBe(index[i]?.url)
		}
	})

	test('the Traditional Chinese twin lists the same entries', () => {
		expect(hubZh).toContain('建基於 Sylphx')
		expect(hubZh.match(/<li class="tile" /g)?.length).toBe(index.length)
		expect(hubZh).toContain('開始建構')
	})
})

describe('open-source hub page', () => {
	test('lists every open-source card once, in both languages, with licence, GitHub link and star badge', () => {
		expect(tools.length).toBeGreaterThan(0)
		expect(oss.match(/<li class="tile" /g)?.length).toBe(tools.length)
		expect(ossZh.match(/<li class="tile" /g)?.length).toBe(tools.length)
		for (const card of tools) {
			expect(oss).toContain(`href="${card.url}"`)
			expect(oss).toContain(`Open source · ${card.licence}`)
			expect(oss).toContain(`href="https://github.com/${card.repo}">GitHub</a>`)
			expect(oss).toContain(`https://mark.sylphx.com/github/stars/${card.repo}.svg`)
		}
		expect(ossZh).toContain('開源 · MIT')
	})

	test('is a sales page: no defensive "closed" section and no self-disclosure', () => {
		expect(oss).toContain('<h1>Open-source tools from Sylphx</h1>')
		expect(oss).not.toMatch(/what is not published|stays closed|were not true/i)
		expect(oss).not.toContain('openapi.json')
	})

	test('shows the platform SDK and CLI row from data', () => {
		expect(oss).toContain('<h2>Sylphx SDK and CLI</h2>')
		for (const surface of site.surfaces) expect(oss).toContain(`href="${surface.url}"`)
	})

	test('has its own canonical, share image and title', () => {
		expect(oss).toContain('<link rel="canonical" href="https://sylphx.com/open-source">')
		expect(oss).toContain('hreflang="zh-Hant" href="https://sylphx.com/open-source/zh-hant"')
		expect(oss).toContain('/apps/_assets/hub/open-source-og.en.webp')
		expect(oss).toContain('<title>Open-source tools for AI agents and developers · Sylphx</title>')
	})

	test('an open-source card with services also appears on the apps hub, once per hub', () => {
		const both = tools.filter((c) => (c.services?.length ?? 0) > 0)
		expect(both.length).toBeGreaterThan(0)
		for (const card of both) {
			expect(hub.split(`href="${card.url}"`).length - 1).toBe(1)
			expect(oss.split(`href="${card.url}"`).length - 1).toBe(1)
		}
	})
})

describe('shell', () => {
	const pages = [...files].filter(([path]) => path.endsWith('.html'))

	test('every page has the platform header and the four-column footer', () => {
		for (const [path, body] of pages) {
			for (const needle of [
				'href="/docs"',
				'href="/pricing"',
				'href="/login"',
				'href="/signup"',
				'href="/legal/terms"',
				'href="/legal/privacy"',
				'href="/contact"',
			]) {
				expect(body, `${path} lacks ${needle}`).toContain(needle)
			}
			expect(body.match(/<div><h2>/g)?.length, path).toBe(4)
		}
	})

	test('every footer carries the company name, number, office, phone and hi@ address', () => {
		const year = String(new Date().getUTCFullYear())
		for (const [path, body] of pages) {
			expect(body, path).toContain(`© ${year} Sylphx Limited`)
			expect(body, path).toContain('16438428')
			expect(body, path).toContain('+44 333 335 7935')
			expect(body, path).toContain('href="mailto:hi@sylphx.com">hi@sylphx.com</a>')
			expect(body, path).not.toContain('contact@sylphx.com')
		}
	})

	test('every platform link the pages use is on the known list', () => {
		for (const [path, body] of pages) {
			for (const [, href = ''] of body.matchAll(/(?:href|src)="(\/[^"]*)"/g)) {
				if (/^\/(?:apps|open-source|\.well-known)(?:[/?#]|$)/.test(href)) continue
				expect(PLATFORM_PATHS, `${path} links ${href}`).toContain(href)
			}
		}
	})
})

describe('generic code', () => {
	const read = (dir: string): string[] =>
		readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
			e.isDirectory() ? read(join(dir, e.name)) : [join(dir, e.name)],
		)
	const sources = [...read(join(import.meta.dir, '../src')), ...read(join(import.meta.dir, '../scripts'))]
	const code = sources.map((f) => readFileSync(f, 'utf8')).join('\n')

	test('no product name or slug appears in src/ or scripts/: product names are data in content/', () => {
		const names = new Set<string>()
		for (const card of site.cards)
			for (const n of [card.slug, card.name.en, card.name['zh-Hant']]) names.add(n)
		for (const app of site.apps) for (const n of [app.slug, app.name.en, app.name['zh-Hant']]) names.add(n)
		for (const source of site.sources) names.add(source.slug)
		for (const name of names) {
			const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
			expect(code, `product name "${name}" in code`).not.toMatch(
				new RegExp(`(?<![\\w-])${escaped}(?![\\w-])`, 'i'),
			)
		}
	})
})
