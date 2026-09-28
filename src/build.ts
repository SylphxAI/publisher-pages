/**
 * Builds the static site into `dist/`: `bun run build`.
 *
 * Output paths mirror the served URLs. nginx serves `dist/` as-is.
 */

import { access, copyFile, mkdir, readdir, rm, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { FONT_PREFIX } from './brand'
import {
	type AppContent,
	appAssets,
	ContentError,
	LOCALES,
	type OpenSource,
	type Publisher,
	validateApp,
	validateOpenSource,
	validatePublisher,
} from './content'
import {
	appLanding,
	appleAppSiteAssociation,
	appPrivacy,
	appSupport,
	appsIndex,
	appTerms,
	assetLinks,
	localized,
	notFound,
	openSourcePage,
	themeCss,
} from './render'

const ROOT = join(import.meta.dir, '..')
/** The vendored brand home, written by scripts/sync-brand.sh. */
const VENDOR = join(ROOT, 'vendor/brand')
/**
 * Vendored files the build does not serve: the font loader is composed into
 * `site.css` (with its urls pointed at this host's paths) instead, so serving
 * the copy as well would publish a loader whose `src` urls do not resolve.
 */
const NOT_SERVED = new Set(['fonts/fonts.css'])

async function readJson(path: string): Promise<unknown> {
	return JSON.parse(await Bun.file(path).text())
}

/** Every file of the vendored brand home, keyed by its path under it. */
async function vendoredBrand(dir = VENDOR, prefix = ''): Promise<[string, string][]> {
	const found: [string, string][] = []
	for (const entry of await readdir(dir, { withFileTypes: true })) {
		const path = prefix === '' ? entry.name : `${prefix}/${entry.name}`
		if (entry.isDirectory()) found.push(...(await vendoredBrand(join(dir, entry.name), path)))
		else if (path !== 'SOURCE' && !NOT_SERVED.has(path)) found.push([path, join(dir, entry.name)])
	}
	return found
}

/**
 * The stylesheet the pages load: the home's tokens, then its font loader, then
 * this site's own sheet, which only names the roles they define.
 *
 * The loader's `/fonts/` urls are pointed at `FONT_PREFIX` — the prefix these
 * pages are mounted at, since sylphx.com serves them under `/apps` and not at
 * a host root. That one substitution is the whole difference from the
 * vendored file; tests/brand.test.ts checks it is the only one.
 */
export async function brandSheet(): Promise<string> {
	const text = (path: string) => Bun.file(join(ROOT, path)).text()
	const loader = (await text('vendor/brand/fonts/fonts.css')).replaceAll('url(/fonts/', `url(${FONT_PREFIX}/`)
	return [
		'/* tokens/brand.css - the Sylphx brand home, vendored. Do not edit. */',
		await text('vendor/brand/tokens/brand.css'),
		`/* fonts/fonts.css - the home's font loader, served from ${FONT_PREFIX}/. */`,
		loader,
		'/* src/site.css - this site, on the roles above. */',
		await text('src/site.css'),
	].join('\n')
}

export interface Site {
	publisher: Publisher
	apps: AppContent[]
	openSource: OpenSource
	/** Where each app's asset files live: `content/apps/{slug}/`. */
	contentDir: string
}

export async function loadSite(contentDir = join(ROOT, 'content')): Promise<Site> {
	const publisher = validatePublisher(await readJson(join(contentDir, 'publisher.json')), 'publisher.json')
	const openSource = validateOpenSource(
		await readJson(join(contentDir, 'open-source.json')),
		'open-source.json',
	)
	const appDir = join(contentDir, 'apps')
	const files = (await readdir(appDir)).filter((f) => f.endsWith('.json')).sort()
	const apps: AppContent[] = []
	for (const file of files) {
		const app = validateApp(await readJson(join(appDir, file)), `content/apps/${file}`)
		for (const asset of appAssets(app)) {
			await access(join(appDir, app.slug, asset)).catch(() => {
				throw new ContentError(`content/apps/${file}: missing asset content/apps/${app.slug}/${asset}`)
			})
		}
		apps.push(app)
	}
	return { publisher, apps, openSource, contentDir }
}

/** Every file of the built site, keyed by its path under `dist/`. */
export async function renderSite({ publisher, apps, openSource }: Site): Promise<Map<string, string>> {
	const files = new Map<string, string>()
	const html = (path: string, body: string) => files.set(join(path.slice(1), 'index.html'), body)
	for (const locale of LOCALES) {
		html(localized(locale, '/apps'), appsIndex(apps, locale, publisher))
		html(localized(locale, '/open-source'), openSourcePage(openSource, locale, publisher))
		for (const app of apps) {
			if (app.external) continue
			const base = localized(locale, `/apps/${app.slug}`)
			html(base, appLanding(app, locale, publisher))
			html(`${base}/privacy`, appPrivacy(app, locale, publisher))
			html(`${base}/terms`, appTerms(app, locale, publisher))
			html(`${base}/support`, appSupport(app, locale, publisher))
		}
	}
	for (const app of apps) {
		if (app.theme) files.set(`apps/_assets/${app.slug}/theme.css`, themeCss(app.theme))
	}
	files.set('apps/_assets/site.css', await brandSheet())
	files.set('apps/404.html', notFound(publisher))
	files.set('.well-known/apple-app-site-association', appleAppSiteAssociation(apps))
	files.set('.well-known/assetlinks.json', assetLinks(apps))
	return files
}

export async function build(outDir = join(ROOT, 'dist')): Promise<Map<string, string>> {
	const site = await loadSite()
	const files = await renderSite(site)
	await rm(outDir, { recursive: true, force: true })
	for (const [path, body] of files) {
		const target = join(outDir, path)
		await mkdir(dirname(target), { recursive: true })
		await writeFile(target, body)
	}
	// The brand home's own files — the lockups, the icons and the fonts the
	// sheet loads — served exactly as vendored.
	for (const [path, from] of await vendoredBrand()) {
		const target = join(outDir, 'apps/_assets/brand', path)
		await mkdir(dirname(target), { recursive: true })
		await copyFile(from, target)
	}
	for (const app of site.apps) {
		for (const asset of appAssets(app)) {
			const target = join(outDir, 'apps/_assets', app.slug, asset)
			await mkdir(dirname(target), { recursive: true })
			await copyFile(join(site.contentDir, 'apps', app.slug, asset), target)
		}
	}
	return files
}

if (import.meta.main) {
	const files = await build()
	const brand = (await vendoredBrand()).length
	console.log(`built ${files.size} pages and sheets, and copied ${brand} brand files, into dist/`)
}
