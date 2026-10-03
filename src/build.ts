/**
 * Builds the static site into `dist/`: `bun run build`.
 *
 * Output paths mirror the served URLs. nginx serves `dist/` as-is.
 */

import { access, copyFile, mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import {
	type AppContent,
	appAssets,
	type Card,
	ContentError,
	cardAssets,
	cardImageProblem,
	LOCALES,
	type Publisher,
	type Source,
	type Surface,
	validateApp,
	validateCard,
	validatePublisher,
	validateSources,
	validateSurfaces,
} from './content'
import {
	appLanding,
	appleAppSiteAssociation,
	appPrivacy,
	appSupport,
	appsIndex,
	appsIndexJson,
	appTerms,
	assetLinks,
	filterCss,
	hubOgFile,
	localized,
	notFound,
	openSourceIndex,
	themeCss,
} from './render'

const ROOT = join(import.meta.dir, '..')
/** The vendored brand home, written by scripts/sync-brand.sh. */
const VENDOR = join(ROOT, 'vendor/brand')

async function readJson(path: string): Promise<unknown> {
	return JSON.parse(await Bun.file(path).text())
}

/** Every file of the vendored brand home, keyed by its path under it. */
async function vendoredBrand(dir = VENDOR, prefix = ''): Promise<[string, string][]> {
	const found: [string, string][] = []
	for (const entry of await readdir(dir, { withFileTypes: true })) {
		const path = prefix === '' ? entry.name : `${prefix}/${entry.name}`
		if (entry.isDirectory()) found.push(...(await vendoredBrand(join(dir, entry.name), path)))
		else if (path !== 'SOURCE') found.push([path, join(dir, entry.name)])
	}
	return found
}

export interface Site {
	publisher: Publisher
	apps: AppContent[]
	/** Product cards, one per `content/cards/{slug}/card.json`. */
	cards: Card[]
	/** The repositories the cards are read from. */
	sources: Source[]
	/** The platform's own published surfaces, for the open-source hub. */
	surfaces: Surface[]
	/** Where each app's and card's asset files live: `content/apps/{slug}/`, `content/cards/{slug}/`. */
	contentDir: string
}

export async function loadSite(contentDir = join(ROOT, 'content')): Promise<Site> {
	const publisher = validatePublisher(await readJson(join(contentDir, 'publisher.json')), 'publisher.json')
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
	const sources = validateSources(await readJson(join(contentDir, 'sources.json')), 'content/sources.json')
	const surfaces = validateSurfaces(
		await readJson(join(contentDir, 'surfaces.json')),
		'content/surfaces.json',
	)
	const cardDir = join(contentDir, 'cards')
	const cards: Card[] = []
	for (const slug of (await readdir(cardDir)).sort()) {
		const where = `content/cards/${slug}/card.json`
		const card = validateCard(await readJson(join(cardDir, slug, 'card.json')), where)
		if (card.slug !== slug) throw new ContentError(`${where}: slug must be ${slug}`)
		for (const file of cardAssets(card)) {
			const bytes = await readFile(join(cardDir, slug, file)).catch(() => {
				throw new ContentError(`${where}: missing asset content/cards/${slug}/${file}`)
			})
			if (card.image?.src === file) {
				const problem = cardImageProblem(bytes)
				if (problem) throw new ContentError(`${where}: ${problem}`)
			}
		}
		cards.push(card)
	}
	const listed = new Set(sources.map((s) => s.slug))
	for (const card of cards) {
		if (!listed.has(card.slug))
			throw new ContentError(`content/cards/${card.slug}: not in content/sources.json`)
	}
	for (const source of sources) {
		if (!cards.some((c) => c.slug === source.slug)) {
			throw new ContentError(
				`content/sources.json: ${source.slug} has no content/cards/${source.slug}/card.json`,
			)
		}
	}
	return { publisher, apps, cards, sources, surfaces, contentDir }
}

/** Every file of the built site, keyed by its path under `dist/`. */
export async function renderSite({ publisher, apps, cards, surfaces }: Site): Promise<Map<string, string>> {
	const files = new Map<string, string>()
	const html = (path: string, body: string) => files.set(join(path.slice(1), 'index.html'), body)
	for (const locale of LOCALES) {
		html(localized(locale, '/apps'), appsIndex(cards, locale, publisher))
		html(localized(locale, '/open-source'), openSourceIndex(cards, surfaces, locale, publisher))
		for (const app of apps) {
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
	files.set(
		'apps/_assets/site.css',
		`${await Bun.file(join(ROOT, 'src/site.css')).text()}${filterCss(cards)}`,
	)
	files.set('apps/index.json', appsIndexJson(cards, publisher))
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
	for (const card of site.cards) {
		for (const asset of cardAssets(card)) {
			const target = join(outDir, 'apps/_assets/cards', card.slug, asset)
			await mkdir(dirname(target), { recursive: true })
			await copyFile(join(site.contentDir, 'cards', card.slug, asset), target)
		}
	}
	// The hubs' share images, designed once from the brand tokens.
	for (const hub of ['apps', 'open-source'] as const) {
		for (const locale of LOCALES) {
			const file = hubOgFile(hub, locale)
			const target = join(outDir, 'apps/_assets/hub', file)
			await mkdir(dirname(target), { recursive: true })
			await copyFile(join(site.contentDir, 'hub', file), target)
		}
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
