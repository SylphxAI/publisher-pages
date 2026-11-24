import { expect, test } from 'bun:test'
import { loadSite, renderSite } from '../src/build'
import { LOCALES, validateApp } from '../src/content'
import { localized } from '../src/render'

const site = await loadSite()
const files = await renderSite(site)
const base = '/apps/number-grove'
const body = (path: string) => files.get(`${path.slice(1)}/index.html`) ?? ''

test('the Sylphx logo returns readers to the platform home in their language', () => {
	for (const locale of LOCALES) {
		const home = locale === 'zh-Hant' ? 'https://sylphx.com/zh-hant-hk' : '/'
		for (const path of ['/apps', base, `${base}/privacy`, `${base}/terms`, `${base}/support`]) {
			expect(body(localized(locale, path)), path).toContain(
				`<header class="bar">\n\t\t\t<a class="brand" href="${home}">`,
			)
		}
	}
})

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
		const label = locale === 'en' ? 'See lesson screens' : '查看課程畫面'
		expect(html).toContain(`class="button lesson-link" href="#lesson-preview">${label} <`)
		expect(html).toMatch(/id="lesson-preview" tabindex="-1"/)
		expect(html).toContain(`lesson.${locale === 'en' ? 'en' : 'zh'}.webp`)
		expect(html).not.toMatch(/href="https:\/\/(apps\.apple\.com|play\.google\.com)/)
	}
})

test('For parents, landing FAQ and support distinguish PIN setup, return and recovery', () => {
	const copy = {
		en: {
			setupAndReturn:
				'Answer a multiplication question to set your parent PIN the first time. After that, just enter your PIN.',
			featureRecovery: 'If you forget it, answer a new multiplication question to set a new PIN.',
			faqRecovery:
				'If you forget it, choose “Forgot PIN?” and answer a new multiplication question to set a new PIN. Your child’s progress stays intact.',
		},
		'zh-Hant': {
			setupAndReturn: '首次進入時，先答一道乘法題，再設定家長 PIN。之後只需輸入 PIN。',
			featureRecovery: '忘記 PIN 的話，答另一道乘法題就可以重新設定。',
			faqRecovery: '忘記 PIN 的話，選「忘記 PIN？」並答另一道乘法題，就可以重新設定。孩子的進度會保留。',
		},
	}
	for (const locale of LOCALES) {
		const { setupAndReturn, featureRecovery, faqRecovery } = copy[locale]
		const landing = body(localized(locale, base))
		const support = body(localized(locale, `${base}/support`))
		const features = landing.match(/<ul class="features">([\s\S]+?)<\/ul>/)?.[1] ?? ''
		expect(features).toContain(`${setupAndReturn}${locale === 'en' ? ' ' : ''}${featureRecovery}</p>`)
		const answer = `${setupAndReturn}${locale === 'en' ? ' ' : ''}${faqRecovery}</p>`
		expect(landing).toContain(`${answer}</details>`)
		expect(support).toContain(answer)
	}
})

test('the pricing card and both FAQ surfaces include first-level Free play in the free tier', () => {
	const copy = {
		en: {
			plan: 'First-level Practice and Free play',
			faq: 'The Seed Garden is free: 23 Adventure lessons within 1 to 5, the Daily garden and the first level of both Practice and Free play.',
		},
		'zh-Hant': {
			plan: '「練習」和「自由玩」的第一級',
			faq: '「種子花園」免費：有 23 課練習 1 至 5 的冒險課程、每日花園，以及「練習」和「自由玩」的第一級。',
		},
	}
	for (const locale of LOCALES) {
		const { plan, faq } = copy[locale]
		const landing = body(localized(locale, base))
		const support = body(localized(locale, `${base}/support`))
		expect(landing).toContain(`<li>${plan}</li>`)
		expect(landing).toContain(`</summary><p>${faq}`)
		expect(support).toContain(`<p>${faq}`)
	}
})

test('the Chinese session intro tells parents when children can take a break', () => {
	expect(body(localized('zh-Hant', base))).toContain(
		'<p class="lede">每次幾分鐘，只練習一個概念，做完就可以休息。</p>',
	)
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
