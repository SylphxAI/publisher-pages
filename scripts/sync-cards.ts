/**
 * Pulls each listed product's `publisher/card.json` (and the image and icon it
 * names) from the product's own repository into `content/cards/{slug}/`, and
 * opens one auto-merging pull request per changed card: `bun scripts/sync-cards.ts`.
 *
 * - `content/sources.json` is the listing gate: only repositories named there are read.
 * - A repository without `publisher/card.json` keeps its current copy (the seed or the last good sync).
 * - A card that fails validation or an online check fails alone: its copy is not touched, the other cards still sync.
 * - Environment: `SOURCE_TOKEN` reads the product repositories (read-only GitHub App token, private repos included);
 *   `GH_TOKEN` pushes the branch and opens the pull request in this repository.
 * - Flags: `--dry-run` reads and checks but writes nothing; `--only <slug>` syncs one card (repository_dispatch).
 */

import { mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import {
	type Card,
	ContentError,
	cardAssets,
	cardImageProblem,
	type Source,
	validateCard,
	validateSources,
} from '../src/content'

const ROOT = join(import.meta.dir, '..')
const CARDS = join(ROOT, 'content/cards')

/** What the sync needs from the outside world; tests pass a fake. */
export interface SyncIo {
	/** A file of a repository at a ref, or null when it does not exist. */
	file(repo: string, ref: string, path: string): Promise<Uint8Array | null>
	repo(repo: string): Promise<{ private: boolean; licence: string | null }>
	/** The final HTTP status of a GET (redirects followed) and the URL it ended on. */
	fetchUrl(url: string): Promise<{ status: number; finalUrl: string }>
}

export interface Outcome {
	slug: string
	state: 'unchanged' | 'changed' | 'skipped' | 'failed'
	/** Why it failed or was skipped. */
	problems: string[]
	/** The card's files by name, when `changed`. */
	files?: Map<string, Uint8Array>
	/** Things worth a look that do not block the sync. */
	warnings: string[]
}

const decode = (bytes: Uint8Array) => new TextDecoder().decode(bytes)

/** The registrable part of a host, approximated as its last two labels. */
function site(url: string): string {
	return new URL(url).hostname.split('.').slice(-2).join('.')
}

/** Read, validate and check one source against `current`, the files now in `content/cards/{slug}/`. */
export async function syncSource(
	source: Source,
	current: Map<string, Uint8Array>,
	io: SyncIo,
): Promise<Outcome> {
	const out: Outcome = { slug: source.slug, state: 'unchanged', problems: [], warnings: [] }
	const fail = (...problems: string[]): Outcome => ({ ...out, state: 'failed', problems })
	const raw = await io.file(source.repo, source.ref, 'publisher/card.json')
	if (raw === null)
		return { ...out, state: 'skipped', problems: ['no publisher/card.json yet; the current copy stays'] }
	let card: Card
	try {
		card = validateCard(JSON.parse(decode(raw)), `${source.repo} publisher/card.json`)
	} catch (error) {
		return fail(error instanceof ContentError || error instanceof SyntaxError ? error.message : String(error))
	}
	if (card.slug !== source.slug) return fail(`slug ${card.slug} is not the registered ${source.slug}`)
	const files = new Map<string, Uint8Array>([['card.json', raw]])
	for (const name of cardAssets(card)) {
		const bytes = await io.file(source.repo, source.ref, `publisher/${name}`)
		if (bytes === null) return fail(`publisher/${name} is named by the card but missing`)
		if (card.image?.src === name) {
			const problem = cardImageProblem(bytes)
			if (problem) return fail(problem)
		}
		files.set(name, bytes)
	}
	const problems: string[] = []
	const live = await io.fetchUrl(card.url).catch(() => ({ status: 0, finalUrl: card.url }))
	if (live.status !== 200) problems.push(`url ${card.url} answers ${live.status}, not 200`)
	else if (site(live.finalUrl) !== site(card.url)) problems.push(`url redirects off-site to ${live.finalUrl}`)
	if (card.kind === 'open-source') {
		if (card.repo !== source.repo) problems.push(`repo ${card.repo} is not the registered ${source.repo}`)
		const info = await io.repo(source.repo).catch(() => undefined)
		if (!info) problems.push(`cannot read ${source.repo} metadata`)
		else {
			if (info.private)
				problems.push(`${source.repo} is private; an open-source card needs a public repository`)
			if (info.licence !== card.licence)
				problems.push(`licence ${card.licence} differs from the repository's ${info.licence}`)
		}
	}
	if (card.services) {
		const toml = await io.file(source.repo, source.ref, 'sylphx.toml')
		if (toml === null) out.warnings.push('the repository has no sylphx.toml, so its services are unproven')
	}
	if (problems.length > 0) return { ...fail(...problems), warnings: out.warnings }
	const same =
		current.size === files.size &&
		[...files].every(([name, bytes]) => {
			const old = current.get(name)
			return old !== undefined && Buffer.compare(Buffer.from(old), Buffer.from(bytes)) === 0
		})
	return { ...out, state: same ? 'unchanged' : 'changed', files }
}

function githubIo(token: string): SyncIo {
	const headers = {
		Authorization: `Bearer ${token}`,
		'X-GitHub-Api-Version': '2022-11-28',
		'User-Agent': 'publisher-pages-sync',
	}
	return {
		async file(repo, ref, path) {
			const res = await fetch(
				`https://api.github.com/repos/${repo}/contents/${path}?ref=${encodeURIComponent(ref)}`,
				{
					headers: { ...headers, Accept: 'application/vnd.github.raw+json' },
				},
			)
			if (res.status === 404) return null
			if (!res.ok) throw new Error(`${repo} ${path}: HTTP ${res.status}`)
			return new Uint8Array(await res.arrayBuffer())
		},
		async repo(repo) {
			const res = await fetch(`https://api.github.com/repos/${repo}`, {
				headers: { ...headers, Accept: 'application/vnd.github+json' },
			})
			if (!res.ok) throw new Error(`${repo}: HTTP ${res.status}`)
			const body = (await res.json()) as { private: boolean; license: { spdx_id: string } | null }
			return { private: body.private, licence: body.license?.spdx_id ?? null }
		},
		async fetchUrl(url) {
			const res = await fetch(url, {
				redirect: 'follow',
				headers: { 'User-Agent': 'publisher-pages-sync' },
				signal: AbortSignal.timeout(20_000),
			})
			return { status: res.status, finalUrl: res.url }
		},
	}
}

async function currentFiles(slug: string): Promise<Map<string, Uint8Array>> {
	const dir = join(CARDS, slug)
	const found = new Map<string, Uint8Array>()
	for (const name of await readdir(dir).catch(() => [])) found.set(name, await readFile(join(dir, name)))
	return found
}

async function run(cmd: string[], opts: { allowFail?: boolean } = {}): Promise<string> {
	const proc = Bun.spawn(cmd, { cwd: ROOT, stdout: 'pipe', stderr: 'pipe' })
	const [out, err, code] = await Promise.all([
		new Response(proc.stdout).text(),
		new Response(proc.stderr).text(),
		proc.exited,
	])
	if (code !== 0 && !opts.allowFail)
		throw new Error(`${cmd.join(' ')} failed (${code}): ${err.trim() || out.trim()}`)
	return out.trim()
}

/** Write the card's files, commit them on `sync/card-{slug}` and open or refresh its auto-merging pull request. */
async function openPullRequest(outcome: Outcome): Promise<void> {
	const { slug, files } = outcome
	if (!files) return
	const branch = `sync/card-${slug}`
	const dir = join(CARDS, slug)
	await run(['git', 'switch', '-C', branch, 'origin/main'])
	await rm(dir, { recursive: true, force: true })
	await mkdir(dir, { recursive: true })
	for (const [name, bytes] of files) await writeFile(join(dir, name), bytes)
	try {
		await run(['bun', 'run', 'check'])
	} catch (error) {
		await run(['git', 'checkout', '--', 'content/cards'], { allowFail: true })
		await run(['git', 'clean', '-fdq', 'content/cards'], { allowFail: true })
		throw new Error(
			`${slug}: bun run check failed with the synced card: ${(error as Error).message.slice(0, 600)}`,
		)
	}
	await run(['git', 'add', '-A', 'content/cards'])
	await run(['git', 'commit', '-m', `content(cards): sync ${slug} from its repository`])
	await run(['git', 'push', '--force-with-lease', 'origin', branch])
	const existing = await run([
		'gh',
		'pr',
		'list',
		'--head',
		branch,
		'--state',
		'open',
		'--json',
		'number',
		'--jq',
		'.[0].number',
	])
	if (existing === '') {
		await run([
			'gh',
			'pr',
			'create',
			'--base',
			'main',
			'--head',
			branch,
			'--title',
			`content(cards): sync ${slug} from its repository`,
			'--body',
			`Automatic sync of \`content/cards/${slug}/\` from the product repository named in \`content/sources.json\`. The card passed the schema, the image rules and the online checks.`,
			'--label',
			'owner:services',
		])
	}
	await run(['gh', 'pr', 'merge', branch, '--auto', '--squash'], { allowFail: true })
	await run(['git', 'switch', '-'], { allowFail: true })
}

if (import.meta.main) {
	const args = process.argv.slice(2)
	const dry = args.includes('--dry-run')
	const only = args.includes('--only') ? args[args.indexOf('--only') + 1] : undefined
	const token = process.env.SOURCE_TOKEN ?? process.env.GH_TOKEN
	if (!token) throw new Error('SOURCE_TOKEN (or GH_TOKEN) is required')
	const sources = validateSources(
		JSON.parse(await readFile(join(ROOT, 'content/sources.json'), 'utf8')),
		'content/sources.json',
	).filter((s) => only === undefined || s.slug === only)
	if (only !== undefined && sources.length === 0) throw new Error(`${only} is not in content/sources.json`)
	const io = githubIo(token)
	let failed = 0
	for (const source of sources) {
		let outcome: Outcome
		try {
			outcome = await syncSource(source, await currentFiles(source.slug), io)
		} catch (error) {
			outcome = { slug: source.slug, state: 'failed', problems: [(error as Error).message], warnings: [] }
		}
		console.log(
			`${outcome.state.padEnd(9)} ${outcome.slug}${outcome.problems.length ? `: ${outcome.problems.join('; ')}` : ''}`,
		)
		for (const w of outcome.warnings) console.log(`          warning: ${w}`)
		if (outcome.state === 'failed') failed++
		else if (outcome.state === 'changed' && !dry) {
			try {
				await openPullRequest(outcome)
			} catch (error) {
				failed++
				console.log(`failed    ${outcome.slug}: ${(error as Error).message}`)
			}
		}
	}
	if (failed > 0) process.exit(1)
}
