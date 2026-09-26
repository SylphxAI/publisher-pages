import { describe, expect, test } from 'bun:test'
import { join } from 'node:path'
import { loadSite, renderSite } from '../src/build'
import { type AppContent, ContentError, type OpenSourceProject, validateApp } from '../src/content'
import { appleAppSiteAssociation, assetLinks, starsBadge } from '../src/render'

const site = await loadSite()
const files = renderSite(site)

/** The paths the site is mounted at on sylphx.com (see README). */
const MOUNTS = [
	'/apps',
	'/open-source',
	'/.well-known/apple-app-site-association',
	'/.well-known/assetlinks.json',
]

/** Gateway PathPrefix semantics: the prefix itself or a path below it. */
const mounted = (href: string) => {
	const path = href.split(/[?#]/)[0] ?? ''
	return MOUNTS.some((m) => path === m || path.startsWith(`${m}/`))
}

describe('served pages', () => {
	test('every app page exists in both languages', () => {
		for (const app of site.apps.filter((a) => !a.external)) {
			for (const prefix of ['apps/', 'apps/zh-hant/']) {
				for (const page of ['', '/privacy', '/support']) {
					expect(files.has(`${prefix}${app.slug}${page}/index.html`)).toBe(true)
				}
			}
		}
		expect(files.has('apps/index.html')).toBe(true)
		expect(files.has('apps/zh-hant/index.html')).toBe(true)
		expect(files.has('open-source/zh-hant/index.html')).toBe(true)
	})

	test('every internal link and asset stays inside a mounted path', () => {
		for (const [path, body] of files) {
			if (!path.endsWith('.html')) continue
			for (const [, href = ''] of body.matchAll(/(?:href|src)="(\/[^"]*)"/g)) {
				if (href === '/' || href === '/docs') continue // the platform's own pages
				expect(mounted(href), `${path} links ${href}`).toBe(true)
			}
		}
	})

	test('pages declare their language and both hreflang alternates', () => {
		const zh = files.get('apps/zh-hant/number-grove/index.html') ?? ''
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

describe('app look', () => {
	const ng = site.apps.find((a) => a.slug === 'number-grove') as AppContent

	test('an app theme sets the shared custom properties for light and dark', () => {
		const body = files.get('apps/number-grove/index.html') ?? ''
		expect(body).toContain(`--accent:${ng.theme?.light.accent}`)
		expect(body).toContain(`@media (prefers-color-scheme: dark){:root{--bg:${ng.theme?.dark.bg}`)
		expect(files.get('apps/number-grove/privacy/index.html')).toContain('<style>:root{')
		expect(files.get('apps/index.html')).not.toContain('<style>')
	})

	test('sections, plans and the FAQ render on a landing page with sections', () => {
		const body = files.get('apps/zh-hant/number-grove/index.html') ?? ''
		expect(body).toContain('<main id="main" class="wide">')
		expect(body).toContain('<ol class="steps">')
		expect(body).toContain('<ul class="plans">')
		expect(body).toContain('<details><summary>')
		expect(body).toContain('src="/apps/_assets/number-grove/icon.svg"')
	})

	test('rejects a theme colour that is not #rrggbb', () => {
		const theme = { light: { ...ng.theme?.light, accent: 'green' }, dark: ng.theme?.dark }
		expect(() => validateApp({ ...ng, theme }, 'content/apps/number-grove.json')).toThrow(/#rrggbb/)
	})

	test('rejects an asset path that leaves the app folder', () => {
		expect(() => validateApp({ ...ng, icon: '../x.svg' }, 'content/apps/number-grove.json')).toThrow(
			/asset file name/,
		)
	})
})

describe('star badges', () => {
	test('every GitHub project shows a fixed-size, lazy badge from Mark', () => {
		const body = files.get('open-source/zh-hant/index.html') ?? ''
		for (const p of site.openSource.projects) {
			const name = p.repo.replace('https://github.com/', '')
			expect(body).toContain(
				`<img class="badge" src="https://mark.sylphx.com/github/stars/${name}" alt="GitHub 星數" width="110" height="20" loading="lazy"`,
			)
		}
	})

	test('a project can opt out, and a non-GitHub repository has none', () => {
		const p = site.openSource.projects[0] as OpenSourceProject
		expect(starsBadge({ ...p, stars: false }, 'en')).toBe('')
		expect(starsBadge({ ...p, repo: 'https://example.com/x/y' }, 'en')).toBe('')
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

	test('rejects a slug that is a reserved path segment', () => {
		expect(() => validateApp({ ...valid, slug: 'zh-hant' }, file('zh-hant'))).toThrow(/reserved/)
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
