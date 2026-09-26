/**
 * Builds the static site into `dist/`: `bun run build`.
 *
 * Output paths mirror the served URLs. nginx serves `dist/` as-is.
 */

import { mkdir, readdir, rm, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import {
	type AppContent,
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
	assetLinks,
	localized,
	notFound,
	openSourcePage,
} from './render'

const ROOT = join(import.meta.dir, '..')

async function readJson(path: string): Promise<unknown> {
	return JSON.parse(await Bun.file(path).text())
}

export interface Site {
	publisher: Publisher
	apps: AppContent[]
	openSource: OpenSource
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
		apps.push(validateApp(await readJson(join(appDir, file)), `content/apps/${file}`))
	}
	return { publisher, apps, openSource }
}

/** Every file of the built site, keyed by its path under `dist/`. */
export function renderSite({ publisher, apps, openSource }: Site): Map<string, string> {
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
			html(`${base}/support`, appSupport(app, locale, publisher))
		}
	}
	files.set('apps/404.html', notFound(publisher))
	files.set('.well-known/apple-app-site-association', appleAppSiteAssociation(apps))
	files.set('.well-known/assetlinks.json', assetLinks(apps))
	return files
}

export async function build(outDir = join(ROOT, 'dist')): Promise<Map<string, string>> {
	const files = renderSite(await loadSite())
	await rm(outDir, { recursive: true, force: true })
	for (const [path, body] of files) {
		const target = join(outDir, path)
		await mkdir(dirname(target), { recursive: true })
		await writeFile(target, body)
	}
	const css = join(outDir, 'apps/_assets/site.css')
	await mkdir(dirname(css), { recursive: true })
	await writeFile(css, await Bun.file(join(ROOT, 'src/site.css')).text())
	return files
}

if (import.meta.main) {
	const files = await build()
	console.log(`built ${files.size + 1} files into dist/`)
}
