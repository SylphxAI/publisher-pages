/**
 * The Sylphx brand home: `vendor/brand/` is byte for byte what
 * `scripts/sync-brand.sh` copied from `SylphxAI/brand`, and the site takes its
 * look from it rather than from values picked here (owner
 * `standards/experience.md`, "Brand home").
 */

import { describe, expect, test } from 'bun:test'
import { createHash } from 'node:crypto'
import { mkdtempSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { BRAND_PREFIX, FONT_PREFIX, LOCKUP } from '../src/brand'
import { build, loadSite, renderSite } from '../src/build'

const ROOT = join(import.meta.dir, '..')
const VENDOR = join(ROOT, 'vendor/brand')
/** Directories that are not this repository's own sources. */
const ELSEWHERE = new Set(['.git', 'dist', 'node_modules', 'vendor'])

const site = await loadSite()
const rendered = await renderSite(site)
const pages = [...rendered].filter(([path]) => path.endsWith('.html'))
/** The sheet the pages load: the home's tokens and loader, then site.css. */
const sheet = rendered.get('apps/_assets/site.css') ?? ''

/** What scripts/sync-brand.sh recorded: the commit, and each file's hash. */
const source = readFileSync(join(VENDOR, 'SOURCE'), 'utf8')
const commit = source.match(/^commit: (\w+)$/m)?.[1] ?? ''
const recorded = new Map(
	[...source.matchAll(/^([0-9a-f]{64}) {2}(.+)$/gm)].map(([, hash = '', path = '']) => [path, hash]),
)

const sha256 = (path: string) => createHash('sha256').update(readFileSync(path)).digest('hex')

/** Every file under `dir`, keyed by its path under it. */
function walk(dir: string, prefix = ''): string[] {
	return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
		const path = prefix === '' ? entry.name : `${prefix}/${entry.name}`
		if (entry.isDirectory()) {
			return ELSEWHERE.has(entry.name) ? [] : walk(join(dir, entry.name), path)
		}
		return [path]
	})
}

describe('the vendored brand home', () => {
	test('SOURCE names the SylphxAI/brand commit the files came from', () => {
		expect(source).toContain('repository: SylphxAI/brand')
		expect(commit).toMatch(/^[0-9a-f]{40}$/)
		expect(recorded.size).toBeGreaterThan(20)
	})

	test('every vendored file is the one SOURCE recorded', () => {
		for (const [path, hash] of recorded) {
			const file = join(VENDOR, path)
			expect(statSync(file, { throwIfNoEntry: false })?.isFile(), path).toBe(true)
			expect(sha256(file), path).toBe(hash)
		}
	})

	test('vendor/brand holds nothing besides SOURCE and the recorded files', () => {
		expect(
			walk(VENDOR)
				.filter((p) => p !== 'SOURCE')
				.sort(),
		).toEqual([...recorded.keys()].sort())
	})
})

describe('the site on the brand home', () => {
	test('the sheet is the home’s tokens and its font loader, then site.css', () => {
		const read = (path: string) => readFileSync(join(VENDOR, path), 'utf8').trim()
		expect(sheet).toContain(read('tokens/brand.css'))
		// The loader's urls are the one substitution: these pages are mounted at
		// paths of sylphx.com, so they serve the files from FONT_PREFIX.
		const asVendored = sheet.replaceAll(`url(${FONT_PREFIX}/`, 'url(/fonts/')
		expect(asVendored).toContain(read('fonts/fonts.css'))
		expect(sheet).toContain(readFileSync(join(ROOT, 'src/site.css'), 'utf8').trim())
	})

	test('no colour is picked in this repository', () => {
		const own = walk(ROOT).filter((path) => path.endsWith('.css') || path.endsWith('.json'))
		expect(own).toContain('src/site.css')
		for (const path of own) {
			// An app's colours are its own brand home's, and arrive in
			// content/apps/{slug}.json without ever passing through a sheet here.
			if (path.startsWith('content/')) continue
			const hits = readFileSync(join(ROOT, path), 'utf8').match(/#[0-9a-f]{3,8}\b/gi) ?? []
			expect(hits, `${path} picks a colour`).toEqual([])
		}
	})

	test('the sheet loads the home’s faces from this origin only', () => {
		expect(sheet).toContain('font-family: "IBM Plex Sans"')
		expect(sheet).toContain('font-family: "IBM Plex Mono"')
		for (const [, url = ''] of sheet.matchAll(/url\(([^)]+)\)/g)) {
			expect(url, 'a font from another origin').toStartWith(`${FONT_PREFIX}/`)
		}
	})

	test('the header is the home’s lockup, in its light and dark cut', () => {
		for (const [path, body] of pages) {
			expect(body, path).toContain(`<source srcset="${LOCKUP.dark}" media="(prefers-color-scheme: dark)">`)
			expect(body, path).toContain(`<img src="${LOCKUP.light}" alt="Sylphx" width=`)
			expect(body, path).not.toContain('>Sylphx</a>')
		}
	})

	test('the image is built with everything the build reads', () => {
		const dockerfile = readFileSync(join(ROOT, 'Dockerfile'), 'utf8')
		const copied = [...dockerfile.matchAll(/^COPY\s+(?!--from)(\S+)/gm)].map(([, path = '']) => path)
		for (const needed of ['content', 'src', 'vendor/brand']) {
			expect(copied, `${needed} is not in the image`).toContain(needed)
		}
		expect(dockerfile.indexOf('COPY vendor/brand vendor/brand')).toBeLessThan(
			dockerfile.indexOf('RUN bun run build'),
		)
	})

	test('every brand file a page points at is served', async () => {
		const dist = mkdtempSync(join(tmpdir(), 'publisher-pages-'))
		await build(dist)
		const referenced = new Set<string>()
		for (const [, body] of pages) {
			for (const [, value = ''] of body.matchAll(/(?:src|srcset)="([^"]+)"/g)) {
				for (const url of value.split(',')) {
					const path = url.trim()
					if (path.startsWith(`${BRAND_PREFIX}/`)) {
						referenced.add(path.slice(BRAND_PREFIX.length + 1))
					}
				}
			}
		}
		expect(referenced.size).toBeGreaterThan(1)
		for (const path of referenced) {
			const served = join(dist, 'apps/_assets/brand', path)
			expect(statSync(served, { throwIfNoEntry: false })?.isFile(), path).toBe(true)
		}
	})
})

describe('the policy admits the home’s files', () => {
	const conf = readFileSync(join(ROOT, 'nginx.conf'), 'utf8')
	const policy = conf.match(/add_header Content-Security-Policy "([^"]+)" always;/)?.[1] ?? ''
	const directive = (name: string) =>
		policy
			.split(';')
			.map((d) => d.trim().split(/\s+/))
			.find(([n]) => n === name)
			?.slice(1) ?? []

	test('both the fonts and the lockups come from this origin', () => {
		expect(directive('font-src')).toEqual(["'self'"])
		expect(directive('img-src')).toContain("'self'")
	})
})
