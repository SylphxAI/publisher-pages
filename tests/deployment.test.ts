import { describe, expect, test } from 'bun:test'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { build } from '../src/build'
import { csp, manifest, security, staticSite } from './static-manifest'

const apple = '/.well-known/apple-app-site-association'
const android = '/.well-known/assetlinks.json'
const jsonPaths = [apple, android, '/apps/index.json']

// site-server matches whole paths; '*' captures across segments. Header
// rules can overlap, and the last rule wins per header name.
function matchingRules<T>(rules: T[], pattern: (rule: T) => string, path: string) {
	return rules.filter((rule) => {
		const glob = pattern(rule).split('*').map(RegExp.escape).join('.*')
		return new RegExp(`^${glob}$`).test(path)
	})
}

const headersAt = (path: string) =>
	Object.assign({}, ...matchingRules(staticSite.headers, (rule) => rule.path, path).map((rule) => rule.set))
const redirectAt = (path: string) => matchingRules(staticSite.redirects, (rule) => rule.from, path)[0]

describe('Sylphx static site contract', () => {
	test('uses only the static artifact and keeps the shared host mounts', () => {
		expect(manifest.build).toBeUndefined()
		expect(manifest.services).toHaveLength(1)
		expect(manifest.services[0]).toMatchObject({
			name: 'web',
			public_networking: true,
			path_prefixes: ['/apps', apple, android],
		})
		for (const key of ['port', 'instance_type', 'health']) {
			expect(manifest.services[0]).not.toHaveProperty(key)
		}
		expect(manifest.domains).toEqual([{ hostname: 'sylphx.com', service: 'web' }])
		expect(staticSite).toMatchObject({
			build_command: 'bun run build',
			output_dir: 'dist',
			spa_fallback: false,
			not_found: '/apps/404.html',
			clean_urls: false,
			trailing_slash: 'ignore',
		})
	})

	test('declares the exact security policy without overrides', () => {
		expect(csp).toBe(
			"default-src 'none'; script-src 'none'; style-src 'self'; img-src 'self' https://mark.sylphx.com; " +
				"font-src 'self'; manifest-src 'self'; connect-src 'none'; object-src 'none'; base-uri 'none'; " +
				"form-action 'none'; frame-ancestors 'none'; upgrade-insecure-requests",
		)
		expect(security).toEqual({
			'content-security-policy': csp,
			'referrer-policy': 'strict-origin-when-cross-origin',
			'x-content-type-options': 'nosniff',
		})
		for (const { path, set } of staticSite.headers) {
			if (path === '/*') continue
			for (const name of Object.keys(security ?? {})) {
				expect(Object.keys(set).map((key) => key.toLowerCase())).not.toContain(name)
			}
		}
	})

	test('serves exact JSON MIME at all three endpoints and keeps browser cache lifetimes', () => {
		for (const path of jsonPaths) {
			expect(headersAt(path)).toMatchObject({
				'content-type': 'application/json',
				'cache-control': 'max-age=3600',
			})
			expect(redirectAt(path)).toBeUndefined()
		}
		for (const path of ['/apps', '/apps/index.html', '/apps/zh-hant/number-grove/privacy']) {
			expect(headersAt(path)['cache-control']).toBe('max-age=300')
			expect(headersAt(path)['content-type']).toBeUndefined()
		}
		expect(headersAt('/apps/_assets/brand/fonts/fonts.css')['cache-control']).toBe('max-age=3600')
	})

	test('Puzzled redirects both spellings of all eight paths directly to Tryit', () => {
		for (const [prefix, target] of [
			['/apps/puzzled', 'https://tryit.fun/'],
			['/apps/zh-hant/puzzled', 'https://tryit.fun/zh-HK'],
		] as const) {
			for (const page of ['', 'privacy', 'terms', 'support']) {
				const from = page ? [prefix, page].join('/') : prefix
				const to = page ? new URL(page, target.endsWith('/') ? target : `${target}/`).href : target
				for (const path of [from, `${from}/`]) {
					expect(redirectAt(path)).toEqual({ from: path, to, status: 301 })
				}
			}
			expect(redirectAt(`${prefix}/not-a-legacy-page`)).toBeUndefined()
		}
	})

	test('other mounted trailing slashes use a relative 301, not the platform 308', () => {
		for (const [path, target] of [
			['/apps/', '/apps'],
			['/apps/number-grove/privacy/', '/apps/:splat'],
			['/apps/_assets/site.css/', '/apps/:splat'],
			['/apps/not-a-page/', '/apps/:splat'],
			[`${apple}/`, apple],
			[`${android}/`, android],
		] as const) {
			expect(redirectAt(path)).toMatchObject({ to: target, status: 301 })
		}
		for (const path of ['/', '/apps-other/', '/.well-known/not-owned/', '/apps/index.html']) {
			expect(redirectAt(path)).toBeUndefined()
		}
	})

	test('the artifact materializes the JSON, pages, custom 404 and static assets at their URL paths', async () => {
		const dist = await mkdtemp(join(tmpdir(), 'publisher-static-'))
		try {
			const files = await build(dist)
			for (const path of jsonPaths) {
				const data = await readFile(join(dist, path.slice(1)), 'utf8')
				expect(data).toBe(files.get(path.slice(1)) ?? '')
				expect(JSON.parse(data)).not.toBeNull()
			}
			for (const [path, body] of files) {
				expect(await readFile(join(dist, path), 'utf8'), path).toBe(body)
			}
			expect(files.has(staticSite.not_found.slice(1))).toBe(true)
			expect(files.has('apps/index.html')).toBe(true)
			expect(files.has('apps/_assets/site.css')).toBe(true)
		} finally {
			await rm(dist, { recursive: true, force: true })
		}
	})
})
