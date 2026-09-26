/**
 * Content model and validation. Every page is generated from the JSON under
 * `content/`; a missing translation or a malformed field fails the build.
 */

export const LOCALES = ['en', 'zh-Hant'] as const
export type Locale = (typeof LOCALES)[number]
/** A string in every served language. */
export type Text = Record<Locale, string>

export interface Publisher {
	legalName: string
	companyNumber: string
	registeredOffice: string
	jurisdiction: Text
	contactEmail: string
	site: string
}

export interface StoreLink {
	kind: 'app-store' | 'google-play' | 'web'
	url: string
}

export interface AppContent {
	slug: string
	name: Text
	category: Text
	tagline: Text
	/** An app with its own site: the index links there and no pages are built. */
	external?: string
	description?: Text[]
	features?: Array<{ title: Text; body: Text }>
	availability?: { status: 'coming-soon' | 'available'; stores: StoreLink[] }
	support?: { email: string; faq: Array<{ q: Text; a: Text }> }
	privacy?: { updated: string; summary: Text; sections: Array<{ heading: Text; body: Text[] }> }
	deepLinks?: {
		apple?: { appIds: string[]; paths?: string[] }
		android?: { packageName: string; sha256CertFingerprints: string[] }
	}
	source: { repo: string; path: string; note?: string }
}

export interface OpenSourceProject {
	name: string
	summary: Text
	repo: string
	docs: string
	package?: { label: string; url: string }
	mcp?: string
}

export interface OpenSource {
	intro: Text
	projects: OpenSourceProject[]
	platform: Text
	platformLinks: Array<{ label: string; url: string }>
}

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
/** Path segments under `/apps` that are not apps: language twins and assets. */
const RESERVED_SLUGS = new Set(['zh-hant', '_assets'])
const DATE = /^\d{4}-\d{2}-\d{2}$/
const EMAIL = /^[^@\s]+@[^@\s]+\.[a-z]{2,}$/
const APPLE_APP_ID = /^[A-Z0-9]{10}\.[A-Za-z0-9.-]+$/
const SHA256_FINGERPRINT = /^(?:[0-9A-F]{2}:){31}[0-9A-F]{2}$/

export class ContentError extends Error {}

function fail(where: string, message: string): never {
	throw new ContentError(`${where}: ${message}`)
}

function text(value: unknown, where: string): Text {
	if (typeof value !== 'object' || value === null) fail(where, 'expected a translated string')
	for (const locale of LOCALES) {
		const s = (value as Record<string, unknown>)[locale]
		if (typeof s !== 'string' || s.trim() === '') fail(where, `missing ${locale} text`)
	}
	return value as Text
}

function url(value: unknown, where: string): string {
	if (typeof value !== 'string') fail(where, 'expected a URL')
	if (value.startsWith('/')) return value
	let parsed: URL
	try {
		parsed = new URL(value)
	} catch {
		fail(where, `not a URL: ${value}`)
	}
	if (parsed.protocol !== 'https:') fail(where, `not https: ${value}`)
	return value
}

function email(value: unknown, where: string): string {
	if (typeof value !== 'string' || !EMAIL.test(value)) fail(where, 'expected an email address')
	return value
}

function list<T>(value: unknown, where: string, each: (item: unknown, at: string) => T): T[] {
	if (!Array.isArray(value)) fail(where, 'expected a list')
	return value.map((item, i) => each(item, `${where}[${i}]`))
}

export function validateApp(raw: unknown, file: string): AppContent {
	const app = raw as AppContent
	if (typeof app.slug !== 'string' || !SLUG.test(app.slug)) fail(file, 'slug must be kebab-case')
	if (RESERVED_SLUGS.has(app.slug)) fail(file, `slug ${app.slug} is a reserved path segment`)
	if (!file.endsWith(`/${app.slug}.json`)) fail(file, `file name must be ${app.slug}.json`)
	text(app.name, `${file} name`)
	text(app.category, `${file} category`)
	text(app.tagline, `${file} tagline`)
	if (typeof app.source?.repo !== 'string' || typeof app.source?.path !== 'string') {
		fail(file, 'source.repo and source.path are required')
	}
	if (app.external !== undefined) {
		url(app.external, `${file} external`)
		return app
	}
	list(app.description, `${file} description`, text)
	list(app.features, `${file} features`, (f, at) => {
		const feature = f as { title: unknown; body: unknown }
		text(feature.title, `${at}.title`)
		text(feature.body, `${at}.body`)
	})
	const status = app.availability?.status
	if (status !== 'coming-soon' && status !== 'available') fail(file, 'availability.status')
	list(app.availability?.stores, `${file} availability.stores`, (s, at) => {
		const store = s as StoreLink
		if (!['app-store', 'google-play', 'web'].includes(store.kind)) fail(at, 'unknown store kind')
		url(store.url, `${at}.url`)
	})
	if (status === 'available' && app.availability?.stores.length === 0) {
		fail(file, 'an available app needs at least one store link')
	}
	email(app.support?.email, `${file} support.email`)
	list(app.support?.faq, `${file} support.faq`, (f, at) => {
		const item = f as { q: unknown; a: unknown }
		text(item.q, `${at}.q`)
		text(item.a, `${at}.a`)
	})
	if (typeof app.privacy?.updated !== 'string' || !DATE.test(app.privacy.updated)) {
		fail(file, 'privacy.updated must be YYYY-MM-DD')
	}
	text(app.privacy.summary, `${file} privacy.summary`)
	list(app.privacy.sections, `${file} privacy.sections`, (s, at) => {
		const section = s as { heading: unknown; body: unknown }
		text(section.heading, `${at}.heading`)
		list(section.body, `${at}.body`, text)
	})
	const apple = app.deepLinks?.apple
	if (apple) {
		list(apple.appIds, `${file} deepLinks.apple.appIds`, (id, at) => {
			if (typeof id !== 'string' || !APPLE_APP_ID.test(id)) fail(at, 'expected TEAMID.bundle.id')
		})
		for (const path of apple.paths ?? []) {
			if (!path.startsWith(`/apps/${app.slug}`)) fail(file, `deep link path outside /apps/${app.slug}`)
		}
	}
	const android = app.deepLinks?.android
	if (android) {
		if (!/^[a-zA-Z][\w]*(?:\.[a-zA-Z][\w]*)+$/.test(android.packageName)) {
			fail(file, 'deepLinks.android.packageName')
		}
		list(android.sha256CertFingerprints, `${file} deepLinks.android.sha256CertFingerprints`, (f, at) => {
			if (typeof f !== 'string' || !SHA256_FINGERPRINT.test(f)) fail(at, 'expected an SHA-256 fingerprint')
		})
	}
	return app
}

export function validateOpenSource(raw: unknown, file: string): OpenSource {
	const os = raw as OpenSource
	text(os.intro, `${file} intro`)
	text(os.platform, `${file} platform`)
	list(os.projects, `${file} projects`, (p, at) => {
		const project = p as OpenSourceProject
		if (typeof project.name !== 'string' || project.name === '') fail(at, 'name')
		text(project.summary, `${at}.summary`)
		url(project.repo, `${at}.repo`)
		url(project.docs, `${at}.docs`)
		if (project.package) url(project.package.url, `${at}.package.url`)
	})
	list(os.platformLinks, `${file} platformLinks`, (l, at) => {
		url((l as { url: unknown }).url, `${at}.url`)
	})
	return os
}

export function validatePublisher(raw: unknown, file: string): Publisher {
	const p = raw as Publisher
	for (const key of ['legalName', 'companyNumber', 'registeredOffice'] as const) {
		if (typeof p[key] !== 'string' || p[key] === '') fail(file, key)
	}
	text(p.jurisdiction, `${file} jurisdiction`)
	email(p.contactEmail, `${file} contactEmail`)
	url(p.site, `${file} site`)
	return p
}
