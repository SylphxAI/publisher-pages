import { describe, expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { loadSite, renderSite } from '../src/build'
import { ContentError, PLATFORM_SERVICES, validateApp } from '../src/content'
import { hubApps, runsOnSylphx } from '../src/render'

const site = await loadSite()
const files = await renderSite(site)
const index = JSON.parse(files.get('apps/index.json') ?? 'null') as Array<Record<string, unknown>>
const hub = files.get('apps/index.html') ?? ''

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

	test('lists the apps that run on Sylphx, first on the hub page and in the same order', () => {
		expect(index.map((e) => e.slug)).toEqual(runsOnSylphx(site.apps).map((a) => a.slug))
		expect(index.map((e) => e.slug)).toEqual(
			hubApps(site.apps)
				.slice(0, index.length)
				.map((a) => a.slug),
		)
		for (const entry of index) expect(hub).toContain(`href="${entry.url}"`)
	})

	test('slugs are unique', () => {
		expect(new Set(index.map((e) => e.slug)).size).toBe(index.length)
	})

	test('an app without services is not in the JSON', () => {
		expect(index.some((e) => e.slug === 'number-grove')).toBe(false)
	})

	test('nginx serves it as JSON with an hourly cache', () => {
		const conf = readFileSync(join(import.meta.dir, '../nginx.conf'), 'utf8')
		const block = conf.match(/location = \/apps\/index\.json \{[^}]*\}/)?.[0] ?? ''
		expect(block).toContain('application/json')
		expect(block).toContain('expires 1h')
	})
})

describe('hub page', () => {
	test('has the title, standfirst and one "Runs on" line per entry', () => {
		expect(hub).toContain('<h1>Built on Sylphx</h1>')
		expect(hub).toContain('Explore apps for work, play and everyday life.')
		expect(hub.match(/Runs on: Sylphx /g)?.length).toBe(index.length)
		for (const entry of index) {
			expect(hub).toContain(String(entry.summary))
			expect(hub).toContain(`Runs on: Sylphx ${(entry.services as string[]).join(', ')}`)
		}
	})

	test('carries a description, canonical and Open Graph tags', () => {
		expect(hub).toContain('<link rel="canonical" href="https://sylphx.com/apps">')
		expect(hub).toMatch(/<meta name="description" content="[^"]{60,}">/)
		expect(hub).toContain('<meta property="og:title" content="Built on Sylphx · Sylphx">')
		expect(hub).toContain('<meta property="og:url" content="https://sylphx.com/apps">')
	})

	test('carries an ItemList of SoftwareApplication as JSON-LD', () => {
		const raw = hub.match(/<script type="application\/ld\+json">([^<]*)<\/script>/)?.[1] ?? ''
		const data = JSON.parse(raw)
		expect(data['@type']).toBe('ItemList')
		expect(data.itemListElement).toHaveLength(hubApps(site.apps).length)
		for (const [i, el] of data.itemListElement.entries()) {
			expect(el.item['@type']).toBe('SoftwareApplication')
			if (i < index.length) expect(el.item.url).toBe(index[i]?.url)
		}
	})

	test('the Traditional Chinese twin lists the same apps', () => {
		const zh = files.get('apps/zh-hant/index.html') ?? ''
		expect(zh).toContain('以 Sylphx 打造的產品')
		expect(zh.match(/運行於：Sylphx /g)?.length).toBe(index.length)
		expect(zh.match(/<a class="app-card"/g)?.length).toBe(hubApps(site.apps).length)
	})
})

const zhHub = files.get('apps/zh-hant/index.html') ?? ''
const card = (page: string, slug: string) =>
	page.match(new RegExp(`<a class="app-card" [^>]*aria-labelledby="app-${slug}"[^>]*>[\\s\\S]*?</a>`))?.[0] ??
	''

test('eight cards have a local product mark, one full-card link and a unique heading in both languages', () => {
	for (const page of [hub, zhHub]) {
		expect(page.match(/class="app-card"/g)).toHaveLength(8)
		for (const app of hubApps(site.apps)) {
			const html = card(page, app.slug)
			expect(html).toContain(`<h2 id="app-${app.slug}">`)
			expect(html).toContain(`class="app-mark" src="/apps/_assets/${app.slug}/${app.icon}" alt=""`)
			expect(html.match(/<a /g)).toHaveLength(1)
		}
	}
})

test('the Chinese hub links both its cards and JSON-LD to the verified locales or labels the English fallbacks', () => {
	const urls = {
		luzzy: 'https://luzzy.chat/zh-Hant',
		mark: 'https://mark.sylphx.com',
		pixzy: 'https://pixzy.ai/zh-tw/',
		spiron: 'https://spiron.ai/zh-hant',
		tachyn: 'https://tachyn.ai/zh-hk',
		tryit: 'https://tryit.fun/zh-HK',
		viszy: 'https://viszy.ai',
	}
	const raw = zhHub.match(/<script type="application\/ld\+json">([^<]*)<\/script>/)?.[1] ?? ''
	const data = JSON.parse(raw)
	for (const [slug, href] of Object.entries(urls)) {
		const html = card(zhHub, slug)
		expect(html).toContain(`href="${href}"`)
		expect(data.itemListElement.map((entry: { item: { url: string } }) => entry.item.url)).toContain(href)
		expect(html.includes('英文網站')).toBe(slug === 'mark' || slug === 'viszy')
	}
	expect(zhHub).not.toContain('建基於 Sylphx')
})

test('Number Grove links to the local landing, marked coming soon and with no service or store claims', () => {
	for (const [page, href, name, status] of [
		[hub, '/apps/number-grove', 'Number Grove', 'Coming soon'],
		[zhHub, '/apps/zh-hant/number-grove', '數字花園', '即將推出'],
	] as const) {
		const html = card(page, 'number-grove')
		expect(html).toContain(`href="${href}"`)
		expect(html).toContain(`>${name}</h2>`)
		expect(html).toContain(`<span class="tag">${status}</span>`)
		expect(html).not.toMatch(/app-services|apps\.apple\.com|play\.google\.com/)
	}
	expect(hubApps(site.apps).at(-1)?.slug).toBe('number-grove')
})

test('Pixzy retains the Chrome extension identity; product photos belong to Viszy', () => {
	const pixzy = index.find((e) => e.slug === 'pixzy')
	expect(pixzy?.name).toBe('Pixzy')
	expect(pixzy?.url).toBe('https://pixzy.ai')
	expect(String(pixzy?.summary)).toContain('Google Photos Delete Tool')
	for (const page of [hub, zhHub]) {
		expect(card(page, 'pixzy')).toContain('>Pixzy</h2>')
		expect(card(page, 'pixzy')).toContain('Google Photos Delete Tool')
	}
	expect(card(zhHub, 'viszy')).toContain('用一張相片，為網店製作商品圖和宣傳短片')
})

describe('internal names', () => {
	test('no served file names an internal engine', () => {
		for (const [path, body] of files) {
			if (!/\.(html|json|txt)$/.test(path)) continue
			for (const name of ['Keel', 'Sylphx Money', 'AnyAgents']) {
				expect({ path, leaks: body.includes(name) }).toEqual({ path, leaks: false })
			}
		}
	})
})

describe('services field', () => {
	const base = {
		slug: 'x',
		name: { en: 'X', 'zh-Hant': 'X' },
		category: { en: 'c', 'zh-Hant': 'c' },
		tagline: { en: 't', 'zh-Hant': 't' },
		external: 'https://example.com',
		source: { repo: 'SylphxAI/x', path: 'sylphx.toml' },
	}
	test('rejects an unknown or empty list', () => {
		expect(() => validateApp({ ...base, services: ['Bogus'] }, 'content/apps/x.json')).toThrow(ContentError)
		expect(() => validateApp({ ...base, services: [] }, 'content/apps/x.json')).toThrow(ContentError)
	})
	test('accepts known services', () => {
		expect(validateApp({ ...base, services: ['Hosting', 'AI'] }, 'content/apps/x.json').services).toEqual([
			'Hosting',
			'AI',
		])
	})
})

describe('Also from Sylphx', () => {
	const zh = files.get('apps/zh-hant/index.html') ?? ''
	test('lists each open-source developer tool with its link, in both languages', () => {
		expect(hub).toContain('<h2>Also from Sylphx</h2>')
		expect(zh).toContain('<h2>Sylphx 的其他產品</h2>')
		for (const name of ['anymd', 'repomap', 'lockdocs', 'firestore_odm']) {
			expect(hub).toContain(`>${name}</a> — `)
			expect(zh).toContain(`>${name}</a> — `)
		}
		expect(hub).toContain('href="https://sylphxai.github.io/anymd/"')
		expect(hub).toContain('href="https://github.com/SylphxAI/lockdocs"')
	})
	test('names no internal agent tooling', () => {
		for (const name of ['anyagents', 'skills', 'mcp-kit']) {
			expect(hub).not.toContain(`>${name}</a> — `)
			expect(zh).not.toContain(`>${name}</a> — `)
		}
		expect(hub.toLowerCase()).not.toContain('anyagents')
	})
	test('a product with a card is not listed again as a tool', () => {
		for (const [en, hk] of [
			['https://mark.sylphx.com', 'https://mark.sylphx.com'],
			['https://pixzy.ai', 'https://pixzy.ai/zh-tw/'],
		]) {
			expect(hub.split(`href="${en}"`).length - 1).toBe(1)
			expect(zh.split(`href="${hk}"`).length - 1).toBe(1)
		}
		expect(hub).not.toContain('>Google Photos Delete Tool</a> — ')
		expect(hub).not.toContain('>Pixzy</a> — ')
		expect(hub).not.toContain('>Mark</a> — ')
	})
	test('does not add an /open-source page', () => {
		expect(files.has('apps/open-source/index.html')).toBe(false)
		expect(files.has('open-source/index.html')).toBe(false)
	})
})

describe('Puzzled is now Tryit', () => {
	test('the hub lists Tryit at its own site and not Puzzled', () => {
		const tryit = index.find((e) => e.slug === 'tryit')
		expect(tryit?.url).toBe('https://tryit.fun')
		expect(index.some((e) => e.slug === 'puzzled')).toBe(false)
		expect(hub).not.toContain('Puzzled')
		expect(hub).not.toContain('puzzled.gg')
	})

	test("nginx sends Puzzled's former pages to the same page on tryit.fun", () => {
		const conf = readFileSync(join(import.meta.dir, '../nginx.conf'), 'utf8')
		/** The target of the `return 301` in the block for this exact location pattern. */
		const redirect = (pattern: string) => {
			const block = conf.split(`location ~ ^${pattern} {`)[1]
			return block?.slice(0, block.indexOf('}')).match(/return 301 ([^;]+);/)?.[1]
		}
		expect(redirect('/apps/puzzled/?$')).toBe('https://tryit.fun/')
		expect(redirect('/apps/puzzled/(privacy|terms|support)/?$')).toBe('https://tryit.fun/$1')
		expect(redirect('/apps/zh-hant/puzzled/?$')).toBe('https://tryit.fun/zh-HK')
		expect(redirect('/apps/zh-hant/puzzled/(privacy|terms|support)/?$')).toBe('https://tryit.fun/zh-HK/$1')
		// The redirects come before the trailing-slash rule, which would otherwise answer first.
		expect(conf.indexOf('location ~ ^/apps/puzzled')).toBeLessThan(conf.indexOf('location ~ ^(/.+)/$'))
	})
})
