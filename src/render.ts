/**
 * Page rendering: plain HTML strings, no client JavaScript and no inline
 * script or style (the CSP in nginx.conf allows neither). Every URL the
 * pages use sits under a path the site is mounted at on sylphx.com
 * (`/apps`, `/open-source`, and the two app-link files), so the pages work
 * behind the path mount without any platform route of their own.
 */

import {
	type AppContent,
	LOCALES,
	type Locale,
	type OpenSource,
	type OpenSourceProject,
	PALETTE_KEYS,
	type Palette,
	type PaletteKey,
	type Picture,
	type Publisher,
	type Section,
	type Text,
} from './content'
import { UI } from './strings'

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
	/** English path of this page, such as `/apps/number-grove`. */
	path: string
	title: string
	description: string
	body: string
	publisher: Publisher
	/** Mark a page that must not be indexed. */
	noindex?: boolean
	/** URL of the app's own colour sheet, if it sets colours. */
	themeSheet?: string
	/** A wider content column, for landing pages with sections. */
	wide?: boolean
	/** Social preview image (absolute path under a mounted prefix). */
	image?: string
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
 */
export function themeCss(theme: NonNullable<AppContent['theme']>): string {
	const vars = (p: Palette) => PALETTE_KEYS.map((k) => `${CSS_VAR[k]}:${p[k]}`).join(';')
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
		year: '2026',
		legal: escapeHtml(publisher.legalName),
		jurisdiction: escapeHtml(t(publisher.jurisdiction)),
		number: escapeHtml(publisher.companyNumber),
	})
	return `<!doctype html>
<html lang="${locale}">
	<head>
		<meta charset="utf-8">
		<meta name="viewport" content="width=device-width, initial-scale=1">
		<title>${escapeHtml(title)}</title>
		<meta name="description" content="${escapeHtml(description)}">
		${noindex ? '<meta name="robots" content="noindex">' : `<link rel="canonical" href="${canonical}">\n\t\t${alternates}\n\t\t<link rel="alternate" hreflang="x-default" href="${publisher.site}${path}">`}
		<meta property="og:title" content="${escapeHtml(title)}">
		<meta property="og:description" content="${escapeHtml(description)}">
		<meta property="og:url" content="${canonical}">
		<meta property="og:type" content="website">
		${image ? `<meta property="og:image" content="${publisher.site}${image}">\n\t\t` : ''}<meta name="color-scheme" content="light dark">
		<link rel="stylesheet" href="${ASSET_PREFIX}/site.css">${themeSheet ? `\n\t\t<link rel="stylesheet" href="${themeSheet}">` : ''}
	</head>
	<body>
		<a class="skip" href="#main">${t(UI.skip)}</a>
		<header class="bar">
			<a class="brand" href="/">Sylphx</a>
			<nav aria-label="${t(UI.language)}">${switcher}</nav>
		</header>
		<main id="main"${wide ? ' class="wide"' : ''}>
${body}
		</main>
		<footer class="foot">
			<nav><a href="${localized(locale, '/apps')}">${t(UI.appsTitle)}</a> <a href="${localized(locale, '/open-source')}">${t(UI.openSourceTitle)}</a> <a href="mailto:${publisher.contactEmail}">${publisher.contactEmail}</a></nav>
			<p>${footer}</p>
		</footer>
	</body>
</html>
`
}

function storeLabel(kind: 'app-store' | 'google-play' | 'web', locale: Locale): string {
	const labels = { 'app-store': UI.appStore, 'google-play': UI.googlePlay, web: UI.web }
	return labels[kind][locale]
}

export function appsIndex(apps: AppContent[], locale: Locale, publisher: Publisher): string {
	const t = (s: Text) => s[locale]
	const cards = apps
		.map((app) => {
			const href = app.external ?? localized(locale, `/apps/${app.slug}`)
			const status =
				app.external === undefined && app.availability?.status === 'coming-soon'
					? `<span class="tag">${t(UI.comingSoon)}</span>`
					: ''
			const action = app.external ? t(UI.visitSite) : t(UI.learnMore)
			return `\t\t\t<li class="card">
				<p class="eyebrow">${escapeHtml(t(app.category))} ${status}</p>
				<h2><a href="${escapeHtml(href)}">${escapeHtml(t(app.name))}</a></h2>
				<p>${escapeHtml(t(app.tagline))}</p>
				<p class="more" aria-hidden="true">${action} →</p>
			</li>`
		})
		.join('\n')
	const body = `\t\t\t<h1>${t(UI.appsTitle)}</h1>
			<p class="lede">${t(UI.appsIntro)}</p>
			<ul class="cards">
${cards}
			</ul>`
	return page({
		locale,
		path: '/apps',
		title: `${t(UI.appsTitle)} · Sylphx`,
		description: t(UI.appsIntro),
		body,
		publisher,
	})
}

function appNav(app: AppContent, locale: Locale): string {
	const t = (s: Text) => s[locale]
	const base = localized(locale, `/apps/${app.slug}`)
	return `\t\t\t<nav class="crumbs" aria-label="${escapeHtml(t(app.name))}">
				<a href="${localized(locale, '/apps')}">${t(UI.allApps)}</a>
				<a href="${base}">${escapeHtml(t(app.name))}</a>
				<a href="${base}/privacy">${t(UI.privacy)}</a>
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
			: `<p class="note"><span class="tag">${t(UI.comingSoon)}</span> ${t(UI.notYetInStores)}</p>`
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
				<p class="links"><a href="${base}/support">${t(UI.support)}</a> <a href="${base}/privacy">${t(UI.privacy)}</a></p>
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
	})
}

const GITHUB_REPO = /^https:\/\/github\.com\/([\w.-]+)\/([\w.-]+)\/?$/

/**
 * The repository's star count as a badge from Mark (mark.sylphx.com), loaded
 * by the browser: no GitHub API call at build time. Fixed box, so a count of
 * any width never shifts the layout.
 */
export function starsBadge(project: OpenSourceProject, locale: Locale): string {
	const match = project.stars === false ? null : GITHUB_REPO.exec(project.repo)
	if (!match) return ''
	const src = `https://mark.sylphx.com/github/stars/${match[1]}/${match[2]}`
	return `<img class="badge" src="${escapeHtml(src)}" alt="${UI.githubStars[locale]}" width="110" height="20" loading="lazy" decoding="async">`
}

export function openSourcePage(os: OpenSource, locale: Locale, publisher: Publisher): string {
	const t = (s: Text) => s[locale]
	const projects = os.projects
		.map((p) => {
			const links = [
				`<a href="${escapeHtml(p.repo)}">${t(UI.repository)}</a>${starsBadge(p, locale)}`,
				`<a href="${escapeHtml(p.docs)}">${t(UI.documentation)}</a>`,
				p.package ? `<a href="${escapeHtml(p.package.url)}">${escapeHtml(p.package.label)}</a>` : '',
			]
				.filter(Boolean)
				.join(' ')
			const mcp = p.mcp ? `<p class="note">${t(UI.mcpRegistry)}: <code>${escapeHtml(p.mcp)}</code></p>` : ''
			return `\t\t\t<li class="card">
				<h2><a href="${escapeHtml(p.repo)}">${escapeHtml(p.name)}</a></h2>
				<p>${escapeHtml(t(p.summary))}</p>
				${mcp}
				<p class="links">${links}</p>
			</li>`
		})
		.join('\n')
	const platform = os.platformLinks
		.map((l) => `<a href="${escapeHtml(l.url)}">${escapeHtml(l.label)}</a>`)
		.join(' ')
	const body = `\t\t\t<h1>${t(UI.openSourceTitle)}</h1>
			<p class="lede">${escapeHtml(t(os.intro))}</p>
			<ul class="cards">
${projects}
			</ul>
			<h2>${t(UI.fromThePlatform)}</h2>
			<p>${escapeHtml(t(os.platform))}</p>
			<p class="links">${platform}</p>`
	return page({
		locale,
		path: '/open-source',
		title: `${t(UI.openSourceTitle)} · Sylphx`,
		description: t(os.intro),
		body,
		publisher,
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
