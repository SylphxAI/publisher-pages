import { expect, test } from 'bun:test'
import { loadSite, renderSite } from '../src/build'
import { LOCALES, validateApp } from '../src/content'
import { localized } from '../src/render'

const site = await loadSite()
const files = await renderSite(site)
const base = '/apps/number-grove'
const body = (path: string) => files.get(`${path.slice(1)}/index.html`) ?? ''

test('all app navigation links mark exactly the current page', () => {
	for (const locale of LOCALES) {
		for (const suffix of ['', '/privacy', '/terms', '/support']) {
			const path = localized(locale, base + suffix)
			const nav = body(path).match(/<nav class="crumbs"[^>]*>([\s\S]+?)<\/nav>/)?.[1] ?? ''
			expect(nav.match(/aria-current="page"/g)).toHaveLength(1)
			expect(nav).toContain(`href="${path}" aria-current="page"`)
		}
	}
})

test('legal section menus match all jumps, with a separate email action', () => {
	for (const locale of LOCALES) {
		for (const route of ['privacy', 'terms']) {
			const html = body(localized(locale, `${base}/${route}`))
			const nav = html.match(/<nav class="doc-toc"[^>]*>([\s\S]+?)<\/nav>/)?.[1] ?? ''
			const entries = [...nav.matchAll(/<a href="#([^"]+)">([^<]+)<\/a>/g)].map((m) => m.slice(1))
			const headings = [...html.matchAll(/<h2 id="([^"]+)" tabindex="-1">([^<]+)<\/h2>/g)].map((m) =>
				m.slice(1),
			)
			expect(entries.length).toBeGreaterThan(5)
			expect(entries).toEqual(headings)
			expect(new Set(entries.map(([id]) => id)).size).toBe(entries.length)
			expect(html).toContain('class="button contact-action" href="mailto:hi@sylphx.com"')
			expect(html.match(/mailto:/g)).toHaveLength(2) // Action + global footer, not inline in the legal sentence.
			if (locale === 'zh-Hant') {
				expect(html).toMatch(/<h1>數字花園：(私隱政策|使用條款)<\/h1>/)
				expect(html).toContain('<p class="note">最後更新：<time')
			}
		}
	}
})

test('the coming-soon landing jumps directly to real lesson screenshots', () => {
	for (const locale of LOCALES) {
		const html = body(localized(locale, base))
		expect(html).toMatch(/class="button lesson-link" href="#lesson-preview"/)
		expect(html).toMatch(/id="lesson-preview" tabindex="-1"/)
		expect(html).toContain(`lesson.${locale === 'en' ? 'en' : 'zh'}.webp`)
		expect(html).not.toMatch(/href="https:\/\/(apps\.apple\.com|play\.google\.com)/)
	}
	const support = body(localized('zh-Hant', `${base}/support`))
	expect(support).toContain('乘法題')
	expect(support).toContain('家長 PIN')
	expect(support).not.toContain('乘數問題')
})

test('rejects invalid localized app handoffs and unsafe external app icon paths', () => {
	const app = site.apps.find((a) => a.slug === 'luzzy')
	if (!app) throw new Error('Missing Luzzy fixture')
	const file = 'content/apps/luzzy.json'
	for (const externalZhHant of ['https://elsewhere.example/zh-Hant', '/zh-Hant', 'https://luzzy.chat/']) {
		expect(() => validateApp({ ...app, externalZhHant }, file)).toThrow(/externalZhHant/)
	}
	expect(() => validateApp({ ...app, icon: '../brand.svg' }, file)).toThrow(/asset file name/)
})
