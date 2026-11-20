import { expect, test } from 'bun:test'
import { cp, mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { loadSite, renderSite } from '../src/build'
import { validateTool } from '../src/content'

const tool = {
	name: 'Example tool',
	url: 'https://example.com/tool',
	summary: { en: 'Example in English', 'zh-Hant': '範例工具' },
}

test('a standalone tool record appears in both hubs without editing an index', async () => {
	const fixture = await mkdtemp(join(tmpdir(), 'publisher-tools-'))
	try {
		await mkdir(join(fixture, 'apps'))
		await mkdir(join(fixture, 'tools'))
		await cp(join(import.meta.dir, '../content/publisher.json'), join(fixture, 'publisher.json'))
		await writeFile(join(fixture, 'tools', '99-example.json'), JSON.stringify(tool))
		const files = await renderSite(await loadSite(fixture))
		expect(files.get('apps/index.html')).toContain(tool.summary.en)
		expect(files.get('apps/zh-hant/index.html')).toContain(tool.summary['zh-Hant'])
		expect(files.get('apps/index.html')).toContain(tool.url)
		expect(files.get('apps/index.json')).not.toContain(tool.name)
	} finally {
		await rm(fixture, { recursive: true, force: true })
	}
})

test('rejects missing translations and non-HTTPS tool links', () => {
	expect(() => validateTool({ ...tool, summary: { en: 'English only' } }, 'tool.json')).toThrow(
		'missing zh-Hant',
	)
	expect(() => validateTool({ ...tool, url: '//example.com/tool' }, 'tool.json')).toThrow(
		'expected an https://',
	)
})
