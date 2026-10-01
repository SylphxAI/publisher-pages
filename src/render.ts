/**
 * Page rendering: plain HTML strings, no client JavaScript and no inline
 * script or style (the CSP in nginx.conf allows neither). Every URL the
 * pages use sits under a path the site is mounted at on sylphx.com
 * (`/apps`, `/open-source` and the two app-link files), so the pages work
 * behind the path mount without any platform route of their own.
 */

import { BRAND_SHEETS, iconLinks, LOCKUP, LOCKUP_HEIGHT, LOCKUP_WIDTH } from './brand'
import {
	type AppContent,
	CARD_CATEGORIES,
	CARD_LIMITS,
	type Card,
	LOCALES,
	type Locale,
	PALETTE_KEYS,
	type Palette,
	type PaletteKey,
	type Picture,
	type Publisher,
	SERVICE_PRODUCT_PATH,
	type Section,
	type Surface,
	type Text,
} from './content'
import { UI } from './strings'
import { KEY_TERMS, TERMS_SECTIONS, TERMS_UPDATED } from './terms'

export const ASSET_PREFIX = '/apps/_assets'
/** Each language's segment, placed after the mounted prefix: `/apps/zh-hant/…`. */
export const LOCALE_SEGMENT: Record<Locale, string> = { en: '', 'zh-Hant': 'zh-hant' }
const LOCALE_NAME: Record<Locale, string> = { en: 'English', 'zh-Hant': '繁體中文' }

/** The served path of an English path in `locale`. */
export function localized(locale: Locale, path: string): string {
	const segment = LOCALE_SEGMENT[locale]
	if (segment === '') return path
	const [, prefix, ...rest] = path.split('/')
	return ['', prefix, segment, ...rest].join('/')
}

export function escapeHtml(value: string): string {
	return value
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;')
		.replaceAll("'", '&#39;')
}

function fill(template: string, values: Record<string, string>): string {
	return template.replace(/\{(\w+)\}/g, (_, key: string) => {
		const value = values[key]
		if (value === undefined) throw new Error(`missing template value ${key}`)
		return value
	})
}

interface PageInput {
	locale: Locale
	/** English path of this page, such as `/apps/{slug}`. */
	path: string
	title: string
	description: string
	body: string
	publisher: Publisher
	/** Flag a page that must not be indexed. */
	noindex?: boolean
	/** URL of the app's own colour sheet, if it sets colours. */
	themeSheet?: string
	/** A wider content column, for landing pages with sections. */
	wide?: boolean
	/** Social preview image (absolute path under a mounted prefix). */
	image?: string
	/** Alt text of the preview image, and its size when it is a designed 1200x630 share card. */
	imageAlt?: string
	imageSize?: { width: number; height: number }
	/** The page's own class on `<main>`, such as the gallery hubs' `hub`. */
	mainClass?: string
	/** Structured data, written as one `application/ld+json` block (a data block: the CSP has no script). */
	jsonLd?: unknown
}

const CSS_VAR: Record<PaletteKey, string> = {
	bg: '--bg',
	fg: '--fg',
	muted: '--muted',
	line: '--line',
	card: '--card',
	accent: '--accent',
	accentFg: '--accent-fg',
	tag: '--tag',
	highlight: '--highlight',
}

/**
 * The app's palette as custom properties over the shared sheet's defaults.
 * It is served as its own file, not an inline `<style>`, so the CSP in
 * nginx.conf needs no `'unsafe-inline'`.
 *
 * The app's own accent is also its accent *text*: unlike Sylphx, an app's
 * brand home names one accent rather than a fill and a text value.
 */
export function themeCss(theme: NonNullable<AppContent['theme']>): string {
	const vars = (p: Palette) =>
		[...PALETTE_KEYS.map((k) => `${CSS_VAR[k]}:${p[k]}`), `--accent-text:${p.accent}`].join(';')
	return `:root{${vars(theme.light)}}@media (prefers-color-scheme: dark){:root{${vars(theme.dark)}}}\n`
}

/** Served URL of an app's colour sheet, if the app sets colours. */
export function themeSheetUrl(app: AppContent): string | undefined {
	return app.theme ? assetUrl(app.slug, 'theme.css') : undefined
}

/** Served URL of an app asset file. */
export function assetUrl(slug: string, file: string): string {
	return `${ASSET_PREFIX}/${slug}/${file}`
}

export function page({
	locale,
	path,
	title,
	description,
	body,
	publisher,
	noindex,
	themeSheet,
	wide,
	image,
	imageAlt,
	imageSize,
	mainClass,
	jsonLd,
}: PageInput): string {
	const t = (s: Text) => s[locale]
	const canonical = `${publisher.site}${localized(locale, path)}`
	const alternates = LOCALES.map(
		(l) => `<link rel="alternate" hreflang="${l}" href="${publisher.site}${localized(l, path)}">`,
	).join('\n\t\t')
	const switcher = LOCALES.filter((l) => l !== locale)
		.map((l) => `<a href="${localized(l, path)}" hreflang="${l}" lang="${l}">${LOCALE_NAME[l]}</a>`)
		.join(' ')
	const footer = fill(t(UI.footerLine), {
		year: String(new Date().getUTCFullYear()),
		legal: escapeHtml(publisher.legalName),
		jurisdiction: escapeHtml(t(publisher.jurisdiction)),
		number: escapeHtml(publisher.companyNumber),
		office: escapeHtml(publisher.registeredOffice),
		phone: escapeHtml(publisher.phone),
	})
	const link = ([href, label]: readonly [string, Text]) => `<a href="${href}">${t(label)}</a>`
	const columns = footerColumns(locale)
		.map(
			(c) =>
				`<div><h2>${t(c.title)}</h2><ul>${c.links.map((l) => `<li>${link(l)}</li>`).join('')}</ul></div>`,
		)
		.join('\n\t\t\t\t')
	const classes = [mainClass, wide ? 'wide' : ''].filter(Boolean).join(' ')
	return `<!doctype html>
<html lang="${locale}">
	<head>
		<meta charset="utf-8">
		<meta name="viewport" content="width=device-width, initial-scale=1">
		${iconLinks()}
		<title>${escapeHtml(title)}</title>
		<meta name="description" content="${escapeHtml(description)}">
		${noindex ? '<meta name="robots" content="noindex">' : `<link rel="canonical" href="${canonical}">\n\t\t${alternates}\n\t\t<link rel="alternate" hreflang="x-default" href="${publisher.site}${path}">`}
		<meta property="og:title" content="${escapeHtml(title)}">
		<meta property="og:description" content="${escapeHtml(description)}">
		<meta property="og:url" content="${canonical}">
		<meta property="og:type" content="website">
		<meta name="twitter:card" content="${image ? 'summary_large_image' : 'summary'}">
		${image ? `<meta property="og:image" content="${publisher.site}${image}">\n\t\t` : ''}${image && imageAlt ? `<meta property="og:image:alt" content="${escapeHtml(imageAlt)}">\n\t\t` : ''}${image && imageSize ? `<meta property="og:image:width" content="${imageSize.width}">\n\t\t<meta property="og:image:height" content="${imageSize.height}">\n\t\t` : ''}<meta name="color-scheme" content="light dark">
		<link rel="stylesheet" href="${BRAND_SHEETS.tokens}">
		<link rel="stylesheet" href="${BRAND_SHEETS.fonts}">
		<link rel="stylesheet" href="${ASSET_PREFIX}/site.css">${themeSheet ? `\n\t\t<link rel="stylesheet" href="${themeSheet}">` : ''}${jsonLd ? `\n\t\t<script type="application/ld+json">${JSON.stringify(jsonLd).replaceAll('<', '\\u003c')}</script>` : ''}
	</head>
	<body>
		<a class="skip" href="#main">${t(UI.skip)}</a>
		<header class="bar">
			<a class="brand" href="/">
				<picture>
					<source srcset="${LOCKUP.dark}" media="(prefers-color-scheme: dark)">
					<img src="${LOCKUP.light}" alt="Sylphx" width="${LOCKUP_WIDTH}" height="${LOCKUP_HEIGHT}">
				</picture>
			</a>
			<nav class="site-nav" aria-label="${t(UI.mainNav)}">${[...HEADER_LINKS].map(link).join('')}<span class="lang" aria-label="${t(UI.language)}">${switcher}</span></nav>
			<div class="actions"><a href="${SIGN_IN}">${t(UI.signIn)}</a><a class="button" href="${SIGN_UP}">${t(UI.startBuilding)}</a></div>
		</header>
		<main id="main"${classes ? ` class="${classes}"` : ''}>
${body}
		</main>
		<footer class="foot">
			<div class="foot-cols">
				${columns}
			</div>
			<p class="foot-line">${footer} <a href="mailto:${publisher.contactEmail}">${publisher.contactEmail}</a></p>
		</footer>
	</body>
</html>
`
}

/** Platform pages the shell links to, relative to sylphx.com. The shell mirrors the platform's own header and footer links. */
const SIGN_IN = '/login'
const SIGN_UP = '/signup'
const HEADER_LINKS = [
	['/docs', UI.navDocs],
	['/pricing', UI.navPricing],
	['/changelog', UI.navChangelog],
] as const
const PRODUCT_LINKS = ['hosting', 'database', 'auth', 'ai', 'sandboxes', 'monitoring'] as const

function footerColumns(locale: Locale): Array<{ title: Text; links: Array<readonly [string, Text]> }> {
	const same = (label: string): Text => ({ en: label, 'zh-Hant': label })
	return [
		{
			title: UI.footProduct,
			links: PRODUCT_LINKS.map((p) => [`/products/${p}`, same(PRODUCT_LABEL[p])] as const),
		},
		{
			title: UI.footDevelopers,
			links: [
				['/docs', UI.navDocs],
				['/docs/api-reference', UI.apiReference],
				['/docs/cli', same('CLI')],
				['/docs/mcp', same('MCP')],
				['https://status.sylphx.com', UI.status],
				['/changelog', UI.navChangelog],
			],
		},
		{
			title: UI.footCompany,
			links: [
				[localized(locale, '/apps'), UI.appsTitle],
				[localized(locale, '/open-source'), UI.openSourceTitle],
				['/about', UI.about],
				['/careers', UI.careers],
				['/contact', UI.contactPage],
				['/security', UI.security],
			],
		},
		{
			title: UI.footLegal,
			links: [
				['/legal/terms', UI.legalTerms],
				['/legal/privacy', UI.legalPrivacy],
				['/legal/sub-processors', UI.subProcessors],
				['/legal/cookies', UI.cookies],
			],
		},
	]
}

const PRODUCT_LABEL: Record<(typeof PRODUCT_LINKS)[number], string> = {
	hosting: 'Hosting',
	database: 'Database',
	auth: 'Auth',
	ai: 'AI',
	sandboxes: 'Sandboxes',
	monitoring: 'Monitoring',
}

/** Platform paths (outside the mounts) that pages here link to; the test checks each answers on sylphx.com. */
export const PLATFORM_PATHS: string[] = [
	'/',
	SIGN_IN,
	SIGN_UP,
	...HEADER_LINKS.map(([href]) => href),
	...PRODUCT_LINKS.map((p) => `/products/${p}`),
	'/docs/api-reference',
	'/docs/cli',
	'/docs/mcp',
	'/about',
	'/careers',
	'/contact',
	'/security',
	'/legal/terms',
	'/legal/privacy',
	'/legal/sub-processors',
	'/legal/cookies',
]

function storeLabel(kind: 'app-store' | 'google-play' | 'web', locale: Locale): string {
	const labels = { 'app-store': UI.appStore, 'google-play': UI.googlePlay, web: UI.web }
	return labels[kind][locale]
}

/** The cards the apps hub lists: those that name the Sylphx services they run on. */
export function hubApps(cards: Card[]): Card[] {
	return cards.filter((c) => (c.services?.length ?? 0) > 0).sort(byName)
}

/** The cards the open-source hub lists. */
export function openSourceCards(cards: Card[]): Card[] {
	return cards.filter((c) => c.kind === 'open-source').sort(byName)
}

function byName(a: Card, b: Card): number {
	return a.name.en.localeCompare(b.name.en, 'en')
}

/** `/apps/index.json`: the machine-readable hub, read by sylphx.com's home page. */
export function appsIndexJson(cards: Card[], _publisher: Publisher): string {
	const entries = hubApps(cards).map((card) => ({
		slug: card.slug,
		name: card.name.en,
		url: card.url,
		summary: card.tagline.en,
		services: card.services,
	}))
	return `${JSON.stringify(entries, null, '\t')}\n`
}

const HUB_PREFIX = { apps: '/apps', 'open-source': '/open-source' } as const
type Hub = keyof typeof HUB_PREFIX

/** File name of a hub's share image in `content/hub/`. */
export function hubOgFile(hub: Hub, locale: Locale): string {
	return `${hub}-og.${locale === 'en' ? 'en' : 'zh'}.webp`
}

function cardAsset(slug: string, file: string): string {
	return `${ASSET_PREFIX}/cards/${slug}/${file}`
}

function categoryIndex(card: Card): number {
	return CARD_CATEGORIES.findIndex((c) => c.en === card.category.en)
}

/**
 * The category filter is CSS only (no script under the CSP): each chip is a
 * radio input, and one generated rule per category hides the other tiles.
 */
export function filterCss(_cards: Card[]): string {
	return CARD_CATEGORIES.map(
		(_, i) => `.hub:has(#cat-${i}:checked) .tile:not([data-cat="${i}"]){display:none}`,
	)
		.join('\n')
		.concat('\n')
}

function tile(card: Card, locale: Locale, eager: boolean, publisher: Publisher): string {
	const t = (x: Text) => escapeHtml(x[locale])
	const host = new URL(card.url).hostname
	const initial = [...card.name[locale]][0] ?? ''
	const media = card.image
		? `<img src="${cardAsset(card.slug, card.image.src)}" alt="${t(card.image.alt)}" width="${CARD_LIMITS.imageWidth}" height="${CARD_LIMITS.imageHeight}" ${eager ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async">`
		: `<span class="fallback" aria-hidden="true">${escapeHtml(initial)}</span>`
	const icon = card.icon
		? `<img class="tile-icon" src="${cardAsset(card.slug, card.icon)}" alt="" width="40" height="40" loading="lazy" decoding="async">`
		: ''
	const status = card.status === 'early-access' ? UI.earlyAccess : UI.available
	const cta = card.status === 'early-access' ? UI.getEarlyAccess : UI.visitSite
	const chips = (card.services ?? [])
		.map((service) => {
			const path = SERVICE_PRODUCT_PATH[service]
			return path ? `<li><a href="/products/${path}">${service}</a></li>` : `<li><span>${service}</span></li>`
		})
		.join('')
	const open =
		card.kind === 'open-source' && card.repo && card.licence
			? `<span class="tag">${fill(UI.openSourceChip[locale], { licence: escapeHtml(card.licence) })}</span>`
			: ''
	const stars = card.kind === 'open-source' && card.repo ? card.repo : undefined
	const actions =
		card.kind === 'open-source' && card.repo
			? `<p class="tile-links"><a href="https://github.com/${escapeHtml(card.repo)}">${UI.github[locale]}</a>${card.docs ? `<a href="${escapeHtml(card.docs)}">${UI.docs[locale]}</a>` : ''}</p>`
			: ''
	return `\t\t\t\t<li class="tile" data-cat="${categoryIndex(card)}">
					<div class="media">${media}</div>
					<div class="tile-body">
						<div class="tile-head">${icon}<h3><a href="${escapeHtml(card.url)}">${t(card.name)}<span class="sr"> ${fill(UI.opens[locale], { host: escapeHtml(host) })}</span></a></h3></div>
						<p class="tagline">${t(card.tagline)}</p>
						<p class="meta"><span class="tag">${t(card.category)}</span><span class="tag ${card.status}">${status[locale]}</span>${open}${stars ? `<img class="stars" src="${escapeHtml(publisher.starBadge.replace('{repo}', stars))}" alt="${UI.stars[locale]}" height="20" loading="lazy" decoding="async">` : ''}</p>
						${chips ? `<ul class="chips" aria-label="${UI.runsOn[locale]} Sylphx"><li class="chips-label" aria-hidden="true">${UI.runsOn[locale]}</li>${chips}</ul>` : ''}
						${actions}
						<p class="more" aria-hidden="true">${cta[locale]} →</p>
					</div>
				</li>`
}
function ctaBand(locale: Locale): string {
	return `\t\t\t<section class="cta">
				<h2>${UI.ctaTitle[locale]}</h2>
				<p>${UI.ctaBody[locale]}</p>
				<p class="cta-actions"><a class="button" href="${SIGN_UP}">${UI.startBuilding[locale]}</a><a class="button ghost" href="/docs">${UI.readDocs[locale]}</a></p>
			</section>`
}

function filters(listed: Card[], locale: Locale): string {
	const present = CARD_CATEGORIES.map((c, i) => ({ c, i })).filter(({ i }) =>
		listed.some((card) => categoryIndex(card) === i),
	)
	if (present.length < 2) return ''
	const chips = present
		.map(
			({ c, i }) =>
				`<input type="radio" name="category" id="cat-${i}"><label for="cat-${i}">${escapeHtml(c[locale])}</label>`,
		)
		.join('')
	return `\t\t\t<fieldset class="filters">
				<legend class="sr">${UI.categoryFilter[locale]}</legend>
				<input type="radio" name="category" id="cat-all" checked><label for="cat-all">${UI.allCategories[locale]}</label>${chips}
			</fieldset>`
}

function itemList(listed: Card[], locale: Locale, name: string) {
	return {
		'@context': 'https://schema.org',
		'@type': 'ItemList',
		name,
		itemListElement: listed.map((card, i) => ({
			'@type': 'ListItem',
			position: i + 1,
			item: {
				'@type': 'SoftwareApplication',
				name: card.name[locale],
				description: card.tagline[locale],
				url: card.url,
				applicationCategory: card.category[locale],
			},
		})),
	}
}

function hubPage(
	hub: Hub,
	locale: Locale,
	publisher: Publisher,
	listed: Card[],
	parts: { title: string; heading: string; intro: string; description: string; extra?: string },
): string {
	const grid = listed.map((card, i) => tile(card, locale, i < 3, publisher)).join('\n')
	const body = `\t\t\t<div class="hub">
			<h1>${parts.heading}</h1>
			<p class="lede">${parts.intro}</p>
${filters(listed, locale)}
			<ul class="tiles">
${grid}
			</ul>
			</div>
${parts.extra ?? ''}
${ctaBand(locale)}`
	return page({
		locale,
		path: HUB_PREFIX[hub],
		title: `${parts.title} · Sylphx`,
		description: parts.description,
		body,
		publisher,
		mainClass: 'hub-page',
		image: `${ASSET_PREFIX}/hub/${hubOgFile(hub, locale)}`,
		imageAlt: parts.title,
		imageSize: { width: 1200, height: 630 },
		jsonLd: itemList(listed, locale, parts.heading),
	})
}

export function appsIndex(cards: Card[], locale: Locale, publisher: Publisher): string {
	const listed = hubApps(cards)
	return hubPage('apps', locale, publisher, listed, {
		title: UI.appsPageTitle[locale],
		heading: UI.appsTitle[locale],
		intro: fill(UI.appsIntro[locale], { count: String(listed.length) }),
		description: UI.appsDescription[locale],
	})
}

export function openSourceIndex(
	cards: Card[],
	surfaces: Surface[],
	locale: Locale,
	publisher: Publisher,
): string {
	const rows = surfaces
		.map(
			(s) =>
				`\t\t\t\t\t<li><a href="${escapeHtml(s.url)}"><code>${escapeHtml(s.name)}</code></a><span>${escapeHtml(s.summary[locale])}</span></li>`,
		)
		.join('\n')
	const extra = `\t\t\t<section class="block surfaces">
				<h2>${UI.surfacesTitle[locale]}</h2>
				<p class="lede">${UI.surfacesIntro[locale]}</p>
				<ul class="surface-list">
${rows}
				</ul>
			</section>`
	return hubPage('open-source', locale, publisher, openSourceCards(cards), {
		title: UI.openSourcePageTitle[locale],
		heading: UI.openSourceHeading[locale],
		intro: UI.openSourceIntro[locale],
		description: UI.openSourceDescription[locale],
		extra,
	})
}

/** An app with no store link is not indexed: its pages stay reachable for store review. */
export function unlisted(app: AppContent): boolean {
	return (app.availability?.stores.length ?? 0) === 0
}

function appNav(app: AppContent, locale: Locale): string {
	const t = (s: Text) => s[locale]
	const base = localized(locale, `/apps/${app.slug}`)
	return `\t\t\t<nav class="crumbs" aria-label="${escapeHtml(t(app.name))}">
				<a href="${localized(locale, '/apps')}">${t(UI.allApps)}</a>
				<a href="${base}">${escapeHtml(t(app.name))}</a>
				<a href="${base}/privacy">${t(UI.privacy)}</a>
				<a href="${base}/terms">${t(UI.terms)}</a>
				<a href="${base}/support">${t(UI.support)}</a>
			</nav>`
}

function img(slug: string, p: Picture, locale: Locale, eager = false): string {
	const loading = eager ? 'fetchpriority="high"' : 'loading="lazy"'
	return `<img src="${assetUrl(slug, p.src[locale])}" alt="${escapeHtml(p.alt[locale])}" width="${p.width}" height="${p.height}" ${loading} decoding="async">`
}

function section(s: Section, locale: Locale): string {
	const t = (x: Text) => escapeHtml(x[locale])
	const tag = s.style === 'steps' ? 'ol' : 'ul'
	const items = s.items.map((i) => `\t\t\t\t\t<li><h3>${t(i.title)}</h3><p>${t(i.body)}</p></li>`).join('\n')
	return `\t\t\t<section class="block">
				<h2>${t(s.heading)}</h2>
				${s.intro ? `<p class="lede">${t(s.intro)}</p>` : ''}
				<${tag} class="${s.style}">
${items}
				</${tag}>
			</section>`
}

export function appLanding(app: AppContent, locale: Locale, publisher: Publisher): string {
	const t = (s: Text) => s[locale]
	const e = (s: Text) => escapeHtml(s[locale])
	const rich = app.sections !== undefined
	const stores = app.availability?.stores ?? []
	const get =
		stores.length > 0
			? `<p class="stores">${stores.map((s) => `<a class="button" href="${escapeHtml(s.url)}">${storeLabel(s.kind, locale)}</a>`).join(' ')}</p>`
			: ''
	const itemHeading = app.featuresHeading ? 'h3' : 'h2'
	const featureItems = (app.features ?? [])
		.map((f) => `\t\t\t\t<li><${itemHeading}>${e(f.title)}</${itemHeading}><p>${e(f.body)}</p></li>`)
		.join('\n')
	const features = app.featuresHeading
		? `\t\t\t<section class="block">
				<h2>${e(app.featuresHeading)}</h2>
				<ul class="features">
${featureItems}
				</ul>
			</section>`
		: `\t\t\t<ul class="features">
${featureItems}
			</ul>`
	const icon = app.icon
		? `<img class="app-icon" src="${assetUrl(app.slug, app.icon)}" alt="" width="88" height="88">`
		: ''
	const heroText = `${icon}
				<p class="eyebrow">${e(app.category)}</p>
				<h1>${e(app.name)}</h1>
				<p class="lede">${e(app.tagline)}</p>
				${get}`
	const hero = app.hero
		? `\t\t\t<section class="hero">
				<div>
				${heroText}
				</div>
				<figure class="shot">${img(app.slug, app.hero, locale, true)}</figure>
			</section>`
		: `\t\t\t${heroText}`
	const description = (app.description ?? []).map((p) => `<p>${e(p)}</p>`).join('\n\t\t\t')
	const plans = app.plans
		? `\t\t\t<section class="block">
				<h2>${e(app.plans.heading)}</h2>
				${app.plans.intro ? `<p class="lede">${e(app.plans.intro)}</p>` : ''}
				<ul class="plans">
${app.plans.tiers
	.map(
		(tier) => `\t\t\t\t\t<li>
						<h3>${e(tier.name)}</h3>
						${tier.price ? `<p class="price">${e(tier.price)}</p>` : ''}
						<ul class="list">${tier.items.map((i) => `<li>${e(i)}</li>`).join('')}</ul>
					</li>`,
	)
	.join('\n')}
				</ul>
				${app.plans.note ? `<p class="note">${e(app.plans.note)}</p>` : ''}
			</section>`
		: ''
	const shots = app.screenshots
		? `\t\t\t<section class="block">
				<h2>${e(app.screenshots.heading)}</h2>
				<ul class="gallery">
${app.screenshots.items.map((p) => `\t\t\t\t\t<li>${img(app.slug, p, locale)}</li>`).join('\n')}
				</ul>
			</section>`
		: ''
	const base = localized(locale, `/apps/${app.slug}`)
	const faq =
		rich && app.support
			? `\t\t\t<section class="block">
				<h2>${t(UI.faq)}</h2>
${app.support.faq.map((f) => `\t\t\t\t<details><summary>${e(f.q)}</summary><p>${e(f.a)}</p></details>`).join('\n')}
				<p class="links"><a href="${base}/support">${t(UI.support)}</a> <a href="${base}/privacy">${t(UI.privacy)}</a> <a href="${base}/terms">${t(UI.terms)}</a></p>
			</section>`
			: ''
	const body = [
		appNav(app, locale),
		hero,
		description ? `\t\t\t<div class="intro">\n\t\t\t${description}\n\t\t\t</div>` : '',
		...(app.sections ?? []).map((s) => section(s, locale)),
		features,
		plans,
		shots,
		faq,
	]
		.filter(Boolean)
		.join('\n')
	return page({
		locale,
		path: `/apps/${app.slug}`,
		title: `${t(app.name)} · Sylphx`,
		description: t(app.tagline),
		body,
		publisher,
		themeSheet: themeSheetUrl(app),
		noindex: unlisted(app),
		wide: rich,
		image: app.hero ? assetUrl(app.slug, app.hero.src[locale]) : undefined,
	})
}

export function appPrivacy(app: AppContent, locale: Locale, publisher: Publisher): string {
	const t = (s: Text) => s[locale]
	const privacy = app.privacy
	if (!privacy) throw new Error(`${app.slug}: no privacy content`)
	const who = fill(t(UI.whoWeAreBody), {
		app: escapeHtml(t(app.name)),
		legal: escapeHtml(publisher.legalName),
		jurisdiction: escapeHtml(t(publisher.jurisdiction)),
		number: escapeHtml(publisher.companyNumber),
		office: escapeHtml(publisher.registeredOffice),
	})
	const email = `<a href="mailto:${publisher.contactEmail}">${publisher.contactEmail}</a>`
	const sections = privacy.sections
		.map(
			(s) =>
				`\t\t\t<h2>${escapeHtml(t(s.heading))}</h2>\n${s.body.map((p) => `\t\t\t<p>${escapeHtml(t(p))}</p>`).join('\n')}`,
		)
		.join('\n')
	const body = `${appNav(app, locale)}
			<h1>${escapeHtml(t(app.name))}: ${t(UI.privacy)}</h1>
			<p class="note">${t(UI.lastUpdated)}: <time datetime="${privacy.updated}">${privacy.updated}</time></p>
			<p class="lede">${escapeHtml(t(privacy.summary))}</p>
			<h2>${t(UI.whoWeAre)}</h2>
			<p>${who}</p>
${sections}
			<h2>${t(UI.yourRights)}</h2>
			<p>${t(UI.yourRightsBody)}</p>
			<h2>${t(UI.rightToObject)}</h2>
			<p>${t(UI.rightToObjectBody)}</p>
			<h2>${t(UI.changes)}</h2>
			<p>${t(UI.changesBody)}</p>
			<h2>${t(UI.contact)}</h2>
			<p>${fill(t(UI.contactBody), { email })}</p>`
	return page({
		locale,
		path: `/apps/${app.slug}/privacy`,
		title: `${t(UI.privacy)} · ${t(app.name)}`,
		description: t(privacy.summary),
		body,
		publisher,
		themeSheet: themeSheetUrl(app),
		noindex: unlisted(app),
	})
}

export function appTerms(app: AppContent, locale: Locale, publisher: Publisher): string {
	const t = (s: Text) => s[locale]
	const values = {
		app: escapeHtml(t(app.name)),
		legal: escapeHtml(publisher.legalName),
		number: escapeHtml(publisher.companyNumber),
		office: escapeHtml(publisher.registeredOffice),
		email: `<a href="mailto:${publisher.contactEmail}">${publisher.contactEmail}</a>`,
	}
	const text = (s: Text) => fill(escapeHtml(t(s)), values)
	const key = KEY_TERMS.map((k) => `\t\t\t\t<li>${text(k)}</li>`).join('\n')
	const sections = TERMS_SECTIONS.map(
		(s, n) =>
			`\t\t\t<h2>${n + 1}. ${text(s.heading)}</h2>\n${s.body.map((p) => `\t\t\t<p>${text(p)}</p>`).join('\n')}`,
	).join('\n')
	const body = `${appNav(app, locale)}
			<h1>${escapeHtml(t(app.name))}: ${t(UI.terms)}</h1>
			<p class="note">${t(UI.lastUpdated)}: <time datetime="${TERMS_UPDATED}">${TERMS_UPDATED}</time></p>
			<h2>${t(UI.keyTerms)}</h2>
			<p>${t(UI.termsIntro)}</p>
			<ul>
${key}
			</ul>
${sections}`
	return page({
		locale,
		path: `/apps/${app.slug}/terms`,
		title: `${t(UI.terms)} · ${t(app.name)}`,
		description: fill(t(KEY_TERMS[0] as Text), { app: t(app.name) }),
		body,
		publisher,
		themeSheet: themeSheetUrl(app),
		noindex: unlisted(app),
	})
}

export function appSupport(app: AppContent, locale: Locale, publisher: Publisher): string {
	const t = (s: Text) => s[locale]
	const support = app.support
	if (!support) throw new Error(`${app.slug}: no support content`)
	const faq = support.faq
		.map((f) => `\t\t\t<h3>${escapeHtml(t(f.q))}</h3>\n\t\t\t<p>${escapeHtml(t(f.a))}</p>`)
		.join('\n')
	const body = `${appNav(app, locale)}
			<h1>${escapeHtml(t(app.name))}: ${t(UI.support)}</h1>
			<p class="lede">${t(UI.supportIntro)}</p>
			${unlisted(app) ? `<p class="note">${t(UI.notYetInStores)}</p>` : ''}
			<p><a class="button" href="mailto:${support.email}?subject=${encodeURIComponent(app.name.en)}">${t(UI.contactUs)}: ${support.email}</a></p>
			<h2>${t(UI.faq)}</h2>
${faq}`
	return page({
		locale,
		path: `/apps/${app.slug}/support`,
		title: `${t(UI.support)} · ${t(app.name)}`,
		description: t(UI.supportIntro),
		body,
		publisher,
		themeSheet: themeSheetUrl(app),
		noindex: unlisted(app),
	})
}

export function notFound(publisher: Publisher): string {
	const body = `\t\t\t<h1>${UI.notFound.en}</h1>
			<p class="lede" lang="en">${UI.notFoundBody.en} <a href="/apps">/apps</a></p>
			<p class="lede" lang="zh-Hant">${UI.notFoundBody['zh-Hant']} <a href="/apps/zh-hant">/apps/zh-hant</a></p>`
	return page({
		locale: 'en',
		path: '/apps',
		title: `${UI.notFound.en} · Sylphx`,
		description: UI.notFoundBody.en,
		body,
		publisher,
		noindex: true,
	})
}

/** Apple universal links, covering each app's own pages. */
export function appleAppSiteAssociation(apps: AppContent[]): string {
	const details = apps.flatMap((app) => {
		const apple = app.deepLinks?.apple
		if (!apple) return []
		const paths = apple.paths ?? [`/apps/${app.slug}/*`]
		return [{ appIDs: apple.appIds, components: paths.map((p) => ({ '/': p })) }]
	})
	return `${JSON.stringify({ applinks: { details } }, null, 2)}\n`
}

/** Android App Links: one statement per app that declares a package. */
export function assetLinks(apps: AppContent[]): string {
	const statements = apps.flatMap((app) => {
		const android = app.deepLinks?.android
		if (!android) return []
		return [
			{
				relation: ['delegate_permission/common.handle_all_urls'],
				target: {
					namespace: 'android_app',
					package_name: android.packageName,
					sha256_cert_fingerprints: android.sha256CertFingerprints,
				},
			},
		]
	})
	return `${JSON.stringify(statements, null, 2)}\n`
}
