import { describe, expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { loadSite, renderSite } from '../src/build'
import { type AppContent, ContentError, validateApp } from '../src/content'
import { appleAppSiteAssociation, assetLinks } from '../src/render'

const site = await loadSite()
const files = await renderSite(site)

/** Structured data is the one script-tag allowed: a data block the browser never runs. */
const withoutJsonLd = (html: string) =>
	html.replace(/<script type="application\/ld\+json">[^<]*<\/script>/g, '')

/** The paths the site is mounted at on sylphx.com (see README). */
const MOUNTS = ['/apps', '/.well-known/apple-app-site-association', '/.well-known/assetlinks.json']

/** Gateway PathPrefix semantics: the prefix itself or a path below it. */
const mounted = (href: string) => {
	const path = href.split(/[?#]/)[0] ?? ''
	return MOUNTS.some((m) => path === m || path.startsWith(`${m}/`))
}

describe('served pages', () => {
	test('every app page exists in both languages', () => {
		for (const app of site.apps.filter((a) => !a.external)) {
			for (const prefix of ['apps/', 'apps/zh-hant/']) {
				for (const page of ['', '/privacy', '/terms', '/support']) {
					expect(files.has(`${prefix}${app.slug}${page}/index.html`)).toBe(true)
				}
			}
		}
		expect(files.has('apps/index.html')).toBe(true)
		expect(files.has('apps/zh-hant/index.html')).toBe(true)
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
		// Companies (Trading Disclosures) Regulations 2008 reg 25: name, number,
		// place of registration and registered office on every page.
		for (const [path, html] of files) {
			if (path.endsWith('.html')) expect(html, path).toContain('128 City Road, London EC1V 2NX')
		}
		expect(body).toContain('Registered office: 128 City Road, London EC1V 2NX')
	})

	test('terms keep the mandatory lines and the company-side ones', () => {
		const body = files.get('apps/number-grove/terms/index.html') ?? ''
		for (const line of [
			'Key terms',
			'Sylphx Limited',
			'death or personal injury',
			'reasonable care and skill',
			'14-day right to cancel',
			'fees paid for Number Grove in the 12 months',
			'within one year',
			'third-party beneficiaries',
			'exclusive jurisdiction of the courts of England and Wales',
		]) {
			expect(body).toContain(line)
		}
		expect(files.get('apps/zh-hant/number-grove/terms/index.html')).toContain('主要條款')
	})

	test('privacy and support pages carry no promise the law does not require', () => {
		const privacy = files.get('apps/number-grove/privacy/index.html') ?? ''
		expect(privacy).toContain('Your right to object')
		expect(privacy).toContain('Information Commissioner')
		for (const [path, body] of files) {
			if (!path.endsWith('.html')) continue
			expect(body, path).not.toContain('within two working days')
			expect(body, path).not.toContain('shown in the app before it applies')
		}
	})

	test('content text is escaped', () => {
		for (const [path, body] of files) {
			if (path.endsWith('.html')) expect(withoutJsonLd(body)).not.toContain('<script')
		}
	})
})

describe('app look', () => {
	const ng = site.apps.find((a) => a.slug === 'number-grove') as AppContent

	test('an app theme sets the shared custom properties for light and dark', () => {
		const css = files.get('apps/_assets/number-grove/theme.css') ?? ''
		expect(css).toContain(`--accent:${ng.theme?.light.accent}`)
		expect(css).toContain(`@media (prefers-color-scheme: dark){:root{--bg:${ng.theme?.dark.bg}`)
		const link = '<link rel="stylesheet" href="/apps/_assets/number-grove/theme.css">'
		expect(files.get('apps/number-grove/index.html')).toContain(link)
		expect(files.get('apps/number-grove/privacy/index.html')).toContain(link)
		expect(files.get('apps/index.html')).not.toContain('theme.css')
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
	const valid = site.apps.find((a) => a.slug === 'number-grove') as AppContent

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

describe('content security policy', () => {
	const conf = readFileSync(join(import.meta.dir, '../nginx.conf'), 'utf8')
	const policy = conf.match(/add_header Content-Security-Policy "([^"]+)" always;/)?.[1] ?? ''
	const directive = (name: string) =>
		policy
			.split(';')
			.map((d) => d.trim().split(/\s+/))
			.find(([n]) => n === name)
			?.slice(1) ?? []
	const pages = [...files].filter(([path]) => path.endsWith('.html'))

	test('nginx sends a strict policy on every response', () => {
		expect(policy).not.toBe('')
		expect(policy).not.toMatch(/unsafe-(inline|eval|hashes)/)
		expect(directive('script-src')).toEqual(["'none'"])
		expect(directive('style-src')).toEqual(["'self'"])
		for (const d of ['object-src', 'base-uri', 'frame-ancestors']) expect(directive(d)).toEqual(["'none'"])
		// A location with its own add_header would drop the server-level headers.
		expect(conf.match(/add_header/g)?.length).toBe(3)
	})

	test('pages carry no inline script, style or event handler', () => {
		for (const [path, body] of pages) {
			expect({
				path,
				hit: withoutJsonLd(body).match(/<script|<style|\sstyle=|\son[a-z]+=|javascript:/i)?.[0],
			}).toEqual({
				path,
				hit: undefined,
			})
		}
	})

	test('every image origin a page uses is allowed', () => {
		const allowed = directive('img-src')
		for (const [, body] of pages) {
			for (const [, origin] of body.matchAll(/<img[^>]*\ssrc="(https?:\/\/[^/"]+)/g)) {
				expect(allowed).toContain(origin ?? '')
			}
		}
	})
})
