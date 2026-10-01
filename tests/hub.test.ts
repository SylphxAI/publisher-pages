import { describe, expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { loadSite, renderSite } from '../src/build'
import { ContentError, PLATFORM_SERVICES, validateApp } from '../src/content'
import { hubApps } from '../src/render'

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

	test('has the same entries as the hub page, in the same order', () => {
		expect(index.map((e) => e.slug)).toEqual(hubApps(site.apps).map((a) => a.slug))
		for (const entry of index) expect(hub).toContain(`href="${entry.url}"`)
	})

	test('slugs are unique', () => {
		expect(new Set(index.map((e) => e.slug)).size).toBe(index.length)
	})

	test('an app without services is not listed', () => {
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
		expect(hub).toContain('The products Sylphx builds and runs on its own platform.')
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
		expect(data.itemListElement).toHaveLength(index.length)
		for (const [i, el] of data.itemListElement.entries()) {
			expect(el.item['@type']).toBe('SoftwareApplication')
			expect(el.item.url).toBe(index[i]?.url)
		}
	})

	test('the Traditional Chinese twin lists the same apps', () => {
		const zh = files.get('apps/zh-hant/index.html') ?? ''
		expect(zh).toContain('建基於 Sylphx')
		expect(zh.match(/運行於：Sylphx /g)?.length).toBe(index.length)
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
	test('lists each open-source tool with its link, in both languages', () => {
		expect(hub).toContain('<h2>Also from Sylphx</h2>')
		expect(zh).toContain('<h2>Sylphx 的其他產品</h2>')
		for (const name of ['anymd', 'repomap', 'lockdocs', 'skills']) {
			expect(hub).toContain(`>${name}</a> — `)
			expect(zh).toContain(`>${name}</a> — `)
		}
		expect(hub).toContain('href="https://github.com/SylphxAI/lockdocs"')
		expect(hub).not.toContain('>Mark</a> — ')
		expect(zh).not.toContain('>Mark</a> — ')
	})
	test('Mark appears once on the hub, as its product card', () => {
		expect(hub.match(/href="https:\/\/mark\.sylphx\.com"/g)?.length).toBe(1)
		expect(zh.match(/href="https:\/\/mark\.sylphx\.com"/g)?.length).toBe(1)
	})
	test('serves /open-source at its own prefix, not under /apps', () => {
		expect(files.has('apps/open-source/index.html')).toBe(false)
		expect(files.has('open-source/index.html')).toBe(true)
		expect(files.has('open-source/zh-hant/index.html')).toBe(true)
	})
})
