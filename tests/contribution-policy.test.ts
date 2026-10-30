import { expect, test } from 'bun:test'
import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'

const release = '96195d86b550ab1205159acb1ae0d75b1fbed47f'
const files = {
	'.github/actions/contribution-policy/contribution_policy.py':
		'dd5eaac6b173c341f3565db88d6c270903771406132b81baee3358a894a62738',
	'policy/contribution-policy.json': 'd2f18e3a8c8d8531c6952f6bb6974ad6196226b6db2a55cf808782ffd07504db',
}

test('approved contribution metadata passes the released check', async () => {
	expect(release).toMatch(/^[a-f0-9]{40}$/)
	const root = mkdtempSync(join(tmpdir(), 'contribution-policy-'))
	try {
		for (const [path, digest] of Object.entries(files)) {
			const response = await fetch(`https://raw.githubusercontent.com/SylphxAI/.github/${release}/${path}`)
			expect(response.ok).toBe(true)
			const content = Buffer.from(await response.arrayBuffer())
			expect(createHash('sha256').update(content).digest('hex')).toBe(digest)
			const target = join(root, path)
			mkdirSync(dirname(target), { recursive: true })
			writeFileSync(target, content)
		}
		const fixture = '.github/fixtures/contribution-metadata.json'
		expect(JSON.parse(readFileSync(fixture, 'utf8'))).toHaveProperty('pull_request')
		const result = spawnSync(
			'python3',
			[join(root, '.github/actions/contribution-policy/contribution_policy.py'), '--input', fixture],
			{ encoding: 'utf8' },
		)
		process.stdout.write(result.stdout)
		expect(result.status).toBe(0)
	} finally {
		rmSync(root, { recursive: true, force: true })
	}
}, 30_000)
