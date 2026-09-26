import { describe, expect, test } from 'bun:test'
import { join } from 'node:path'
import { loadSite, renderSite } from '../src/build'
import { type AppContent, ContentError, validateApp } from '../src/content'
import { appleAppSiteAssociation, assetLinks } from '../src/render'

const site = await loadSite()
const files = renderSite(site)

/** The paths the site is mounted at on sylphx.com (see README). */
const MOUNTS = ['/apps', '/open-source', '/zh-hant/apps', '/zh-hant/open-source', '/.well-known/']

describe('served pages', () => {
	test('every app page exists in both languages', () => {
		for (const app of site.apps.filter((a) => !a.external)) {
			for (const prefix of ['', 'zh-hant/']) {
				for (const page of ['', '/privacy', '/support']) {
					expect(files.has(`${prefix}apps/${app.slug}${page}/index.html`)).toBe(true)
				}
			}
		}
		expect(files.has('apps/index.html')).toBe(true)
		expect(files.has('zh-hant/open-source/index.html')).toBe(true)
	})

	test('every internal link and asset stays inside a mounted path', () => {
		for (const [path, body] of files) {
			if (!path.endsWith('.html')) continue
			for (const [, href = ''] of body.matchAll(/(?:href|src)="(\/[^"]*)"/g)) {
				if (href === '/' || href === '/docs') continue // the platform's own pages
				expect(
					MOUNTS.some((m) => href.startsWith(m)),
					`${path} links ${href}`,
				).toBe(true)
			}
		}
	})

	test('pages declare their language and both hreflang alternates', () => {
		const zh = files.get('zh-hant/apps/number-grove/index.html') ?? ''
		expect(zh).toContain('<html lang="zh-Hant">')
		expect(zh).toContain('hreflang="en" href="https://sylphx.com/apps/number-grove"')
		expect(zh).toContain('數字花園')
	})

	test('privacy pages name the publisher as data controller', () => {
		const body = files.get('apps/number-grove/privacy/index.html') ?? ''
		expect(body).toContain('Sylphx Limited')
		expect(body).toContain('16438428')
		expect(body).toContain('data controller')
	})

	test('content text is escaped', () => {
		for (const [path, body] of files) {
			if (path.endsWith('.html')) expect(body).not.toContain('<script')
		}
	})
})

describe('app-link files', () => {
	const app = (deepLinks: AppContent['deepLinks']): AppContent => ({
		...(site.apps[0] as AppContent),
		deepLinks,
	})

	test('are valid when no app declares ids', () => {
		expect(JSON.parse(files.get('.well-known/apple-app-site-association') ?? '')).toEqual({
			applinks: { details: [] },
		})
		expect(JSON.parse(files.get('.well-known/assetlinks.json') ?? '')).toEqual([])
	})

	test('cover the app paths when ids are declared', () => {
		const a = app({
			apple: { appIds: ['ABCDE12345.com.example.app'] },
			android: { packageName: 'com.example.app', sha256CertFingerprints: [`${'AB:'.repeat(31)}AB`] },
		})
		expect(JSON.parse(appleAppSiteAssociation([a])).applinks.details[0]).toEqual({
			appIDs: ['ABCDE12345.com.example.app'],
			components: [{ '/': `/apps/${a.slug}/*` }],
		})
		expect(JSON.parse(assetLinks([a]))[0].target.package_name).toBe('com.example.app')
	})
})

describe('content validation', () => {
	const file = (slug: string) => join('content/apps', `${slug}.json`)
	const valid = site.apps[0] as AppContent

	test('rejects a missing translation', () => {
		const broken = { ...valid, tagline: { en: 'Only English' } }
		expect(() => validateApp(broken, file(valid.slug))).toThrow(ContentError)
	})

	test('rejects a deep link outside the app path', () => {
		const broken = { ...valid, deepLinks: { apple: { appIds: ['ABCDE12345.x.y'], paths: ['/console/*'] } } }
		expect(() => validateApp(broken, file(valid.slug))).toThrow(/outside/)
	})

	test('accepts an external app with only a card', () => {
		const external = {
			slug: 'elsewhere',
			name: { en: 'Elsewhere', 'zh-Hant': '別處' },
			category: { en: 'Tools', 'zh-Hant': '工具' },
			tagline: { en: 'Has its own site.', 'zh-Hant': '有自己的網站。' },
			external: 'https://example.com',
			source: { repo: 'SylphxAI/elsewhere', path: 'publisher/app.json' },
		}
		expect(validateApp(external, file('elsewhere')).external).toBe('https://example.com')
	})
})
