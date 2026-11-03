import { describe, expect, test } from 'bun:test'
import { loadSite, renderSite } from '../src/build'

const site = await loadSite()
const spiron = site.apps.find((app) => app.slug === 'spiron')

describe('Spiron publisher content', () => {
	test('all privacy and support contacts use the product general inbox', () => {
		expect(spiron).toBeDefined()
		expect(spiron?.support?.email).toBe('hi@spiron.ai')
		const addresses = [...JSON.stringify(spiron).matchAll(/[a-zA-Z0-9._%+-]+@spiron\.ai/g)].map(
			([email]) => email,
		)
		expect([...new Set(addresses)]).toEqual(['hi@spiron.ai'])
	})

	test('records the exact source commit under the current repository name', () => {
		expect(spiron?.source.repo).toBe('SylphxAI/spiron')
		expect(spiron?.source.path).toBe('publisher/app.json')
		expect(spiron?.source.note).toMatch(/^Copied from SylphxAI\/spiron@[0-9a-f]{40}:publisher\/app\.json\./)
	})

	test('keeps the product-owned site rather than creating duplicate policy pages', async () => {
		expect(spiron?.external).toBe('https://spiron.ai')
		const files = await renderSite(site)
		for (const prefix of ['apps/', 'apps/zh-hant/']) {
			expect(files.get(`${prefix}index.html`)).toContain('href="https://spiron.ai"')
			for (const page of ['', '/privacy', '/terms', '/support']) {
				expect(files.has(`${prefix}spiron${page}/index.html`)).toBe(false)
			}
		}
	})
})
