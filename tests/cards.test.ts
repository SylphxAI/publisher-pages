import { describe, expect, test } from 'bun:test'
import { type SyncIo, syncSource } from '../scripts/sync-cards'
import { loadSite } from '../src/build'
import {
	CARD_CATEGORIES,
	CARD_FIELDS,
	type Card,
	ContentError,
	cardImageProblem,
	PLATFORM_SERVICES,
	validateCard,
	validateSources,
	webpSize,
} from '../src/content'

const base: Card = {
	slug: 'x',
	kind: 'app',
	name: { en: 'X', 'zh-Hant': 'X' },
	tagline: { en: 'Does one thing well.', 'zh-Hant': '把一件事做好。' },
	category: CARD_CATEGORIES[0] as Card['category'],
	url: 'https://example.com',
	status: 'available',
	services: ['Hosting'],
}
const file = 'content/cards/x/card.json'
const bad = (patch: Record<string, unknown>, pattern: RegExp) =>
	expect(() => validateCard({ ...base, ...patch }, file)).toThrow(pattern)

/** A WebP header of the given size (VP8X), padded to `bytes`. */
function webp(width: number, height: number, bytes = 1000): Uint8Array {
	const b = new Uint8Array(bytes)
	b.set(new TextEncoder().encode('RIFF'), 0)
	b.set(new TextEncoder().encode('WEBPVP8X'), 8)
	const put = (at: number, n: number) => {
		b[at] = n & 255
		b[at + 1] = (n >> 8) & 255
		b[at + 2] = (n >> 16) & 255
	}
	put(24, width - 1)
	put(27, height - 1)
	return b
}

describe('validateCard', () => {
	test('accepts a valid card and an open-source card', () => {
		expect(validateCard(base, file).slug).toBe('x')
		const oss = { ...base, kind: 'open-source', repo: 'Owner/repo', licence: 'MIT', services: undefined }
		expect(validateCard(oss, file).licence).toBe('MIT')
	})
	test('rejects a missing language', () => {
		bad({ name: { en: 'X' } }, /missing zh-Hant/)
		bad({ tagline: { en: 'Only English.' } }, /missing zh-Hant/)
	})
	test('rejects an unknown field', () => bad({ colour: 'red' }, /unknown field: colour/))
	test('rejects a reserved or malformed slug', () => {
		bad({ slug: 'zh-hant' }, /reserved/)
		bad({ slug: '_assets' }, /kebab-case/)
		bad({ slug: 'Bad Slug' }, /kebab-case/)
	})
	test('rejects a non-https or relative url', () => {
		bad({ url: 'http://example.com' }, /not https/)
		bad({ url: '/apps/x' }, /absolute https/)
	})
	test('rejects a banned word or a long tagline', () => {
		for (const word of [
			'Coming soon: a thing.',
			'Join the waitlist today.',
			'In beta now.',
			'Launching next week.',
		]) {
			bad({ tagline: { en: word, 'zh-Hant': '好。' } }, /banned word/)
		}
		bad({ tagline: { en: 'x'.repeat(111), 'zh-Hant': '好。' } }, /over 110/)
	})
	test('rejects an unlisted category, a status of coming-soon and unknown services', () => {
		bad({ category: { en: 'Misc', 'zh-Hant': '雜項' } }, /closed list/)
		bad({ status: 'coming-soon' }, /status/)
		bad({ services: ['Bogus'] }, /unknown platform service/)
		bad({ services: [] }, /non-empty/)
		bad({ services: ['AI', 'AI'] }, /repeat/)
	})
	test('an app card needs services; an open-source card needs repo and licence', () => {
		bad({ services: undefined }, /needs services/)
		bad({ kind: 'open-source', services: undefined }, /needs repo/)
		bad({ kind: 'open-source', services: undefined, repo: 'a/b' }, /SPDX/)
		bad({ repo: 'a/b', licence: 'MIT' }, /belong to open-source/)
	})
	test('rejects an empty alt and a non-webp image name', () => {
		bad({ image: { src: 'card.webp', alt: { en: '', 'zh-Hant': 'x' } } }, /missing en/)
		bad({ image: { src: 'card.png', alt: { en: 'x', 'zh-Hant': 'x' } } }, /\.webp/)
		bad({ image: { src: '../card.webp', alt: { en: 'x', 'zh-Hant': 'x' } } }, /\.webp/)
	})
})

describe('schema/card.schema.json', async () => {
	const schema = JSON.parse(await Bun.file(`${import.meta.dir}/../schema/card.schema.json`).text())
	test('lists the same fields, categories and services as the validator', () => {
		expect(Object.keys(schema.properties).sort()).toEqual([...CARD_FIELDS].sort())
		const cats = schema.properties.category.oneOf.map(
			(c: { properties: { en: { const: string } } }) => c.properties.en.const,
		)
		expect(cats).toEqual(CARD_CATEGORIES.map((c) => c.en))
		expect(schema.properties.services.items.enum).toEqual([...PLATFORM_SERVICES])
	})
})

describe('card image rules', () => {
	test('1200x750 webp within 60 KB is fine', () => {
		expect(webpSize(webp(1200, 750))).toEqual({ width: 1200, height: 750 })
		expect(cardImageProblem(webp(1200, 750))).toBeUndefined()
	})
	test('wrong size, wrong type and too large are named', () => {
		expect(cardImageProblem(webp(1200, 630))).toMatch(/1200x630/)
		expect(cardImageProblem(new Uint8Array(100))).toMatch(/not a webp/)
		expect(cardImageProblem(webp(1200, 750, 60 * 1024 + 1))).toMatch(/over/)
	})
})

describe('the shipped content', () => {
	test('every card validates, sits in its own folder and is registered once in sources.json', async () => {
		const site = await loadSite()
		expect(site.cards.length).toBeGreaterThan(0)
		expect(new Set(site.cards.map((c) => c.slug)).size).toBe(site.cards.length)
		expect(site.sources.map((s) => s.slug).sort()).toEqual(site.cards.map((c) => c.slug).sort())
	})
	test('sources must be unique, well formed repositories', () => {
		expect(() =>
			validateSources(
				[
					{ slug: 'a', repo: 'o/a', ref: 'main' },
					{ slug: 'a', repo: 'o/b', ref: 'main' },
				],
				's',
			),
		).toThrow(/repeats/)
		expect(() => validateSources([{ slug: 'a', repo: 'nope', ref: 'main' }], 's')).toThrow(ContentError)
		expect(() => validateSources([{ slug: 'a', repo: 'o/a', ref: 'main', extra: 1 }], 's')).toThrow(
			/unknown field/,
		)
	})
})

describe('sync', () => {
	const source = { slug: 'x', repo: 'Owner/x', ref: 'main' }
	const enc = (v: unknown) => new TextEncoder().encode(JSON.stringify(v))
	const io = (files: Record<string, Uint8Array>, over: Partial<SyncIo> = {}): SyncIo => ({
		file: async (_r, _ref, path) => files[path] ?? null,
		repo: async () => ({ private: false, licence: 'MIT' }),
		fetchUrl: async (url) => ({ status: 200, finalUrl: url }),
		...over,
	})

	test('a repository with no card keeps its copy', async () => {
		expect((await syncSource(source, new Map(), io({}))).state).toBe('skipped')
	})
	test('a valid card is changed, then unchanged once copied', async () => {
		const files = { 'publisher/card.json': enc(base), 'sylphx.toml': new Uint8Array() }
		const first = await syncSource(source, new Map(), io(files))
		expect(first.state).toBe('changed')
		expect((await syncSource(source, first.files as Map<string, Uint8Array>, io(files))).state).toBe(
			'unchanged',
		)
	})
	test('an invalid card fails alone and names the problem', async () => {
		const out = await syncSource(
			source,
			new Map(),
			io({ 'publisher/card.json': enc({ ...base, status: 'coming-soon' }) }),
		)
		expect(out.state).toBe('failed')
		expect(out.problems[0]).toMatch(/status/)
	})
	test('a missing or wrong image fails', async () => {
		const card = { ...base, image: { src: 'card.webp', alt: { en: 'a', 'zh-Hant': 'a' } } }
		expect(
			(await syncSource(source, new Map(), io({ 'publisher/card.json': enc(card) }))).problems[0],
		).toMatch(/missing/)
		const wrong = io({ 'publisher/card.json': enc(card), 'publisher/card.webp': webp(100, 100) })
		expect((await syncSource(source, new Map(), wrong)).problems[0]).toMatch(/100x100/)
	})
	test('a url that does not answer 200, or leaves the site, fails', async () => {
		const files = { 'publisher/card.json': enc(base) }
		const down = await syncSource(
			source,
			new Map(),
			io(files, { fetchUrl: async (u) => ({ status: 503, finalUrl: u }) }),
		)
		expect(down.problems[0]).toMatch(/503/)
		const off = await syncSource(
			source,
			new Map(),
			io(files, { fetchUrl: async () => ({ status: 200, finalUrl: 'https://elsewhere.org/' }) }),
		)
		expect(off.problems[0]).toMatch(/off-site/)
	})
	test('an open-source card needs a public repository and a matching licence', async () => {
		const card = { ...base, kind: 'open-source', repo: 'Owner/x', licence: 'MIT', services: undefined }
		const files = { 'publisher/card.json': enc(card) }
		expect((await syncSource(source, new Map(), io(files))).state).toBe('changed')
		const priv = await syncSource(
			source,
			new Map(),
			io(files, { repo: async () => ({ private: true, licence: 'MIT' }) }),
		)
		expect(priv.problems.join()).toMatch(/private/)
		const lic = await syncSource(
			source,
			new Map(),
			io(files, { repo: async () => ({ private: false, licence: 'Apache-2.0' }) }),
		)
		expect(lic.problems.join()).toMatch(/licence/)
	})
})
