/**
 * Page rendering: plain HTML strings, no client JavaScript. Every URL the
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
	type Publisher,
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
}

export function page({ locale, path, title, description, body, publisher, noindex }: PageInput): string {
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
		<meta name="color-scheme" content="light dark">
		<link rel="stylesheet" href="${ASSET_PREFIX}/site.css">
	</head>
	<body>
		<a class="skip" href="#main">${t(UI.skip)}</a>
		<header class="bar">
			<a class="brand" href="/">Sylphx</a>
			<nav aria-label="${t(UI.language)}">${switcher}</nav>
		</header>
		<main id="main">
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

export function appLanding(app: AppContent, locale: Locale, publisher: Publisher): string {
	const t = (s: Text) => s[locale]
	const stores = app.availability?.stores ?? []
	const get =
		stores.length > 0
			? `<p class="stores">${stores.map((s) => `<a class="button" href="${escapeHtml(s.url)}">${storeLabel(s.kind, locale)}</a>`).join(' ')}</p>`
			: `<p class="note"><span class="tag">${t(UI.comingSoon)}</span> ${t(UI.notYetInStores)}</p>`
	const features = (app.features ?? [])
		.map((f) => `\t\t\t\t<li><h2>${escapeHtml(t(f.title))}</h2><p>${escapeHtml(t(f.body))}</p></li>`)
		.join('\n')
	const body = `${appNav(app, locale)}
			<p class="eyebrow">${escapeHtml(t(app.category))}</p>
			<h1>${escapeHtml(t(app.name))}</h1>
			<p class="lede">${escapeHtml(t(app.tagline))}</p>
			${get}
			${(app.description ?? []).map((p) => `<p>${escapeHtml(t(p))}</p>`).join('\n\t\t\t')}
			<ul class="features">
${features}
			</ul>`
	return page({
		locale,
		path: `/apps/${app.slug}`,
		title: `${t(app.name)} · Sylphx`,
		description: t(app.tagline),
		body,
		publisher,
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
