/**
 * Content model and validation. Every page is generated from the JSON under
 * `content/`; a missing translation or a malformed field fails the build.
 */

export const LOCALES = ['en', 'zh-Hant'] as const
export type Locale = (typeof LOCALES)[number]
/** A string in every served language. */
export type Text = Record<Locale, string>

/** Platform services an app may name as what it runs on. */
export const PLATFORM_SERVICES = [
	'Hosting',
	'Data',
	'AI',
	'Auth',
	'Workflows',
	'Money',
	'Events',
	'Notify',
] as const
export type PlatformService = (typeof PLATFORM_SERVICES)[number]

/** The platform's product page of a service, when it has one: `https://sylphx.com/products/{path}`. */
export const SERVICE_PRODUCT_PATH: Partial<Record<PlatformService, string>> = {
	Hosting: 'hosting',
	Data: 'database',
	Auth: 'auth',
	AI: 'ai',
}

/** The closed list of card categories, so the filter chips stay few. */
export const CARD_CATEGORIES: Text[] = [
	{ en: 'AI agents', 'zh-Hant': 'AI 代理' },
	{ en: 'Developer tools', 'zh-Hant': '開發者工具' },
	{ en: 'Productivity', 'zh-Hant': '效率工具' },
	{ en: 'Learning', 'zh-Hant': '學習' },
	{ en: 'Games and fun', 'zh-Hant': '遊戲及娛樂' },
	{ en: 'Business', 'zh-Hant': '商業' },
]

export type CardKind = 'app' | 'open-source'
export type CardStatus = 'available' | 'early-access'

/** What a product's repository publishes as `publisher/card.json`. */
export interface Card {
	slug: string
	kind: CardKind
	name: Text
	tagline: Text
	category: Text
	url: string
	status: CardStatus
	/** A real product screenshot (1200x750 webp, at most 60 KB), a file next to the card. */
	image?: { src: string; alt: Text }
	/** A byte copy of the product's brand-home icon, a file next to the card. */
	icon?: string
	/** Sylphx services it runs on; a card with services is listed on the apps hub. */
	services?: PlatformService[]
	/** Open-source cards: the public repository (`owner/name`) and its SPDX licence. */
	repo?: string
	licence?: string
	docs?: string
}

/** One product repository the hub reads its card from (`content/sources.json`). */
export interface Source {
	slug: string
	repo: string
	ref: string
}

/** A published developer surface of the platform itself, on the open-source hub. */
export interface Surface {
	name: string
	summary: Text
	url: string
}

export const CARD_LIMITS = { taglineChars: 110, imageBytes: 60 * 1024, imageWidth: 1200, imageHeight: 750 }

export interface Publisher {
	legalName: string
	companyNumber: string
	registeredOffice: string
	jurisdiction: Text
	contactEmail: string
	/** The company phone, shown in every footer. */
	phone: string
	site: string
	/** Star badge image URL with a `{repo}` placeholder (`owner/name`), from the badge service the CSP allows. */
	starBadge: string
}

export interface StoreLink {
	kind: 'app-store' | 'google-play' | 'web'
	url: string
}

/** Colour tokens an app page may set; each maps to a CSS custom property of the shared sheet. */
export const PALETTE_KEYS = [
	'bg',
	'fg',
	'muted',
	'line',
	'card',
	'accent',
	'accentFg',
	'tag',
	'highlight',
] as const
export type PaletteKey = (typeof PALETTE_KEYS)[number]
export type Palette = Record<PaletteKey, string>

/** An image file shipped in `content/apps/{slug}/`, per language. */
export interface Picture {
	src: Text
	alt: Text
	width: number
	height: number
}

export interface Section {
	heading: Text
	intro?: Text
	/** `steps`: numbered sequence; `cards`: a grid of cards; `list`: a checked list. */
	style: 'steps' | 'cards' | 'list'
	items: Array<{ title: Text; body: Text }>
}

export interface PlanTier {
	name: Text
	/** Price as the app states it, with its source in the app repository. */
	price?: Text
	items: Text[]
}

export interface AppContent {
	slug: string
	name: Text
	category: Text
	tagline: Text
	description?: Text[]
	features?: Array<{ title: Text; body: Text }>
	/** Optional look: the app's own colours for light and dark, and its icon. */
	theme?: { light: Palette; dark: Palette }
	/** App icon file in `content/apps/{slug}/`, shown square with rounded corners. */
	icon?: string
	/** One picture beside the hero, such as a phone screenshot. */
	hero?: Picture
	/** Page sections between the hero and the features, in order. */
	sections?: Section[]
	/** What is free and what a subscription adds. */
	plans?: { heading: Text; intro?: Text; tiers: PlanTier[]; note?: Text }
	screenshots?: { heading: Text; items: Picture[] }
	/** Heading for the features grid when a page has sections. */
	featuresHeading?: Text
	availability?: { status: 'coming-soon' | 'available'; stores: StoreLink[] }
	support?: { email: string; faq: Array<{ q: Text; a: Text }> }
	privacy?: { updated: string; summary: Text; sections: Array<{ heading: Text; body: Text[] }> }
	deepLinks?: {
		apple?: { appIds: string[]; paths?: string[] }
		android?: { packageName: string; sha256CertFingerprints: string[] }
	}
	source: { repo: string; path: string; note?: string }
}

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
/** Path segments under `/apps` that are not apps: language twins and assets. */
const RESERVED_SLUGS = new Set(['zh-hant', '_assets'])
const DATE = /^\d{4}-\d{2}-\d{2}$/
const EMAIL = /^[^@\s]+@[^@\s]+\.[a-z]{2,}$/
const APPLE_APP_ID = /^[A-Z0-9]{10}\.[A-Za-z0-9.-]+$/
const HEX_COLOR = /^#[0-9a-fA-F]{6}$/
/** Asset file names: plain, lower-case, one of the image types the site serves. */
export const ASSET_FILE = /^[a-z0-9][a-z0-9._-]*\.(?:svg|png|webp|avif|jpg)$/
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

function asset(value: unknown, where: string): string {
	if (typeof value !== 'string' || !ASSET_FILE.test(value)) fail(where, 'expected an asset file name')
	return value
}

function picture(value: unknown, where: string): Picture {
	const p = value as Picture
	const src = text(p?.src, `${where}.src`)
	for (const locale of LOCALES) asset(src[locale], `${where}.src.${locale}`)
	text(p.alt, `${where}.alt`)
	for (const key of ['width', 'height'] as const) {
		if (!Number.isInteger(p[key]) || p[key] <= 0) fail(where, `${key} must be a positive integer`)
	}
	return p
}

/** Every asset file an app page references, so the build can check and copy them. */
export function appAssets(app: AppContent): string[] {
	const files = new Set<string>()
	if (app.icon) files.add(app.icon)
	for (const p of [app.hero, ...(app.screenshots?.items ?? [])]) {
		if (!p) continue
		for (const locale of LOCALES) files.add(p.src[locale])
	}
	return [...files]
}

export function validateApp(raw: unknown, file: string): AppContent {
	const app = raw as AppContent
	if (typeof app.slug !== 'string' || !SLUG.test(app.slug)) fail(file, 'slug must be kebab-case')
	if (RESERVED_SLUGS.has(app.slug)) fail(file, `slug ${app.slug} is a reserved path segment`)
	if (!file.endsWith(`/${app.slug}.json`)) fail(file, `file name must be ${app.slug}.json`)
	text(app.name, `${file} name`)
	text(app.category, `${file} category`)
	text(app.tagline, `${file} tagline`)
	for (const key of Object.keys(app)) {
		if (key === 'external' || key === 'services')
			fail(file, `${key} moved to the card (content/cards/${app.slug}/card.json)`)
	}
	if (typeof app.source?.repo !== 'string' || typeof app.source?.path !== 'string') {
		fail(file, 'source.repo and source.path are required')
	}
	list(app.description, `${file} description`, text)
	list(app.features, `${file} features`, (f, at) => {
		const feature = f as { title: unknown; body: unknown }
		text(feature.title, `${at}.title`)
		text(feature.body, `${at}.body`)
	})
	if (app.theme !== undefined) {
		for (const mode of ['light', 'dark'] as const) {
			const palette = app.theme[mode] as Record<string, unknown> | undefined
			if (typeof palette !== 'object' || palette === null) fail(file, `theme.${mode}`)
			for (const key of PALETTE_KEYS) {
				const v = palette[key]
				if (typeof v !== 'string' || !HEX_COLOR.test(v)) fail(file, `theme.${mode}.${key} must be #rrggbb`)
			}
		}
	}
	if (app.icon !== undefined) asset(app.icon, `${file} icon`)
	if (app.hero !== undefined) picture(app.hero, `${file} hero`)
	if (app.featuresHeading !== undefined) text(app.featuresHeading, `${file} featuresHeading`)
	if (app.sections !== undefined) {
		list(app.sections, `${file} sections`, (s, at) => {
			const section = s as Section
			text(section.heading, `${at}.heading`)
			if (section.intro !== undefined) text(section.intro, `${at}.intro`)
			if (!['steps', 'cards', 'list'].includes(section.style)) fail(at, 'style must be steps, cards or list')
			list(section.items, `${at}.items`, (item, iat) => {
				const i = item as { title: unknown; body: unknown }
				text(i.title, `${iat}.title`)
				text(i.body, `${iat}.body`)
			})
		})
	}
	if (app.plans !== undefined) {
		text(app.plans.heading, `${file} plans.heading`)
		if (app.plans.intro !== undefined) text(app.plans.intro, `${file} plans.intro`)
		if (app.plans.note !== undefined) text(app.plans.note, `${file} plans.note`)
		list(app.plans.tiers, `${file} plans.tiers`, (tier, at) => {
			const t = tier as PlanTier
			text(t.name, `${at}.name`)
			if (t.price !== undefined) text(t.price, `${at}.price`)
			list(t.items, `${at}.items`, text)
		})
	}
	if (app.screenshots !== undefined) {
		text(app.screenshots.heading, `${file} screenshots.heading`)
		list(app.screenshots.items, `${file} screenshots.items`, picture)
	}
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

export function validatePublisher(raw: unknown, file: string): Publisher {
	const p = raw as Publisher
	for (const key of ['legalName', 'companyNumber', 'registeredOffice'] as const) {
		if (typeof p[key] !== 'string' || p[key] === '') fail(file, key)
	}
	text(p.jurisdiction, `${file} jurisdiction`)
	email(p.contactEmail, `${file} contactEmail`)
	if (typeof p.phone !== 'string' || !/^\+\d[\d ]{6,18}$/.test(p.phone))
		fail(file, 'phone must be +CC digits')
	url(p.site, `${file} site`)
	if (
		typeof p.starBadge !== 'string' ||
		!p.starBadge.startsWith('https://') ||
		!p.starBadge.includes('{repo}')
	) {
		fail(file, 'starBadge must be an https URL with {repo}')
	}
	return p
}

/** The fields a card may carry; `schema/card.schema.json` lists the same. */
export const CARD_FIELDS = [
	'slug',
	'kind',
	'name',
	'tagline',
	'category',
	'url',
	'status',
	'image',
	'icon',
	'services',
	'repo',
	'licence',
	'docs',
] as const
const CARD_KEYS = new Set<string>(CARD_FIELDS)
/** Words a tagline may not use: an unshipped product is not listed. */
const BANNED_TAGLINE = /\b(?:coming soon|soon|beta|waitlist|launching)\b|即將|候補|測試版/i
const REPO = /^[A-Za-z0-9][A-Za-z0-9-]*\/[A-Za-z0-9._-]+$/
const SPDX = /^[A-Za-z0-9.+-]+(?: (?:AND|OR|WITH) [A-Za-z0-9.+-]+)*$/

/** Dimensions of a WebP file (lossy, lossless or extended), or undefined if it is not one. */
export function webpSize(b: Uint8Array): { width: number; height: number } | undefined {
	const tag = (at: number) => String.fromCharCode(...b.slice(at, at + 4))
	if (b.length < 30 || tag(0) !== 'RIFF' || tag(8) !== 'WEBP') return undefined
	const u24 = (at: number) => (b[at] ?? 0) | ((b[at + 1] ?? 0) << 8) | ((b[at + 2] ?? 0) << 16)
	const chunk = tag(12)
	if (chunk === 'VP8X') return { width: u24(24) + 1, height: u24(27) + 1 }
	if (chunk === 'VP8L') {
		const bits = (b[21] ?? 0) | ((b[22] ?? 0) << 8) | ((b[23] ?? 0) << 16) | ((b[24] ?? 0) << 24)
		return { width: (bits & 0x3fff) + 1, height: ((bits >>> 14) & 0x3fff) + 1 }
	}
	if (chunk === 'VP8 ')
		return {
			width: ((b[26] ?? 0) | ((b[27] ?? 0) << 8)) & 0x3fff,
			height: ((b[28] ?? 0) | ((b[29] ?? 0) << 8)) & 0x3fff,
		}
	return undefined
}

/** The image's own rules (1200x750 WebP, at most 60 KB); returns the problem or undefined. */
export function cardImageProblem(bytes: Uint8Array): string | undefined {
	if (bytes.length > CARD_LIMITS.imageBytes)
		return `image is ${bytes.length} bytes, over ${CARD_LIMITS.imageBytes}`
	const size = webpSize(bytes)
	if (!size) return 'image is not a webp file'
	if (size.width !== CARD_LIMITS.imageWidth || size.height !== CARD_LIMITS.imageHeight) {
		return `image is ${size.width}x${size.height}, expected ${CARD_LIMITS.imageWidth}x${CARD_LIMITS.imageHeight}`
	}
	return undefined
}

/** Every file a card references next to `card.json`. */
export function cardAssets(card: Card): string[] {
	return [card.image?.src, card.icon].filter((f): f is string => f !== undefined)
}

export function validateCard(raw: unknown, file: string): Card {
	if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) fail(file, 'expected an object')
	const card = raw as Card
	for (const key of Object.keys(card)) if (!CARD_KEYS.has(key)) fail(file, `unknown field: ${key}`)
	if (typeof card.slug !== 'string' || !SLUG.test(card.slug)) fail(file, 'slug must be kebab-case')
	if (RESERVED_SLUGS.has(card.slug)) fail(file, `slug ${card.slug} is a reserved path segment`)
	if (card.kind !== 'app' && card.kind !== 'open-source') fail(file, 'kind must be app or open-source')
	text(card.name, `${file} name`)
	text(card.tagline, `${file} tagline`)
	text(card.category, `${file} category`)
	for (const locale of LOCALES) {
		if (card.tagline[locale].length > CARD_LIMITS.taglineChars) {
			fail(file, `tagline.${locale} is over ${CARD_LIMITS.taglineChars} characters`)
		}
		if (BANNED_TAGLINE.test(card.tagline[locale])) fail(file, `tagline.${locale} uses a banned word`)
	}
	if (!CARD_CATEGORIES.some((c) => LOCALES.every((l) => c[l] === card.category[l]))) {
		fail(file, 'category is not on the closed list')
	}
	url(card.url, `${file} url`)
	if (card.url.startsWith('/')) fail(file, 'url must be absolute https')
	if (card.status !== 'available' && card.status !== 'early-access')
		fail(file, 'status must be available or early-access')
	if (card.image !== undefined) {
		if (typeof card.image !== 'object' || card.image === null) fail(file, 'image must be an object')
		for (const key of Object.keys(card.image))
			if (key !== 'src' && key !== 'alt') fail(file, `unknown field: image.${key}`)
		if (typeof card.image.src !== 'string' || !/^[a-z0-9][a-z0-9._-]*\.webp$/.test(card.image.src)) {
			fail(file, 'image.src must be a .webp file name')
		}
		text(card.image.alt, `${file} image.alt`)
	}
	if (card.icon !== undefined) asset(card.icon, `${file} icon`)
	if (card.services !== undefined) {
		if (!Array.isArray(card.services) || card.services.length === 0)
			fail(file, 'services must be a non-empty list')
		for (const service of card.services) {
			if (!PLATFORM_SERVICES.includes(service)) fail(file, `unknown platform service: ${service}`)
		}
		if (new Set(card.services).size !== card.services.length) fail(file, 'services repeat')
	}
	if (card.kind === 'open-source') {
		if (typeof card.repo !== 'string' || !REPO.test(card.repo))
			fail(file, 'an open-source card needs repo (owner/name)')
		if (typeof card.licence !== 'string' || !SPDX.test(card.licence))
			fail(file, 'an open-source card needs an SPDX licence')
	} else if (card.repo !== undefined || card.licence !== undefined) {
		fail(file, 'repo and licence belong to open-source cards')
	}
	if (card.docs !== undefined) url(card.docs, `${file} docs`)
	if (card.kind === 'app' && (card.services?.length ?? 0) === 0) fail(file, 'an app card needs services')
	return card
}

export function validateSources(raw: unknown, file: string): Source[] {
	const sources = list(raw, file, (item, at) => {
		const s = item as Source
		for (const key of Object.keys(s))
			if (!['slug', 'repo', 'ref'].includes(key)) fail(at, `unknown field: ${key}`)
		if (typeof s.slug !== 'string' || !SLUG.test(s.slug)) fail(at, 'slug must be kebab-case')
		if (typeof s.repo !== 'string' || !REPO.test(s.repo)) fail(at, 'repo must be owner/name')
		if (typeof s.ref !== 'string' || s.ref === '') fail(at, 'ref is required')
		return s
	})
	if (new Set(sources.map((s) => s.slug)).size !== sources.length) fail(file, 'a slug repeats')
	return sources
}

export function validateSurfaces(raw: unknown, file: string): Surface[] {
	return list(raw, file, (item, at) => {
		const s = item as Surface
		if (typeof s.name !== 'string' || s.name === '') fail(at, 'name')
		text(s.summary, `${at}.summary`)
		url(s.url, `${at}.url`)
		return s
	})
}
