import type { Text } from './content'

/**
 * An open-source tool Sylphx publishes for developers. Descriptions follow each
 * repository's GitHub description; a tool with its own site links there.
 */
export interface Tool {
	name: string
	url: string
	summary: Text
}

/** The "Also from Sylphx" list on the apps hub. */
export const TOOLS: Tool[] = [
	{
		name: 'anymd',
		url: 'https://sylphxai.github.io/anymd/',
		summary: {
			en: 'Any file → clean Markdown for AI agents: PDF, Word, PowerPoint, Excel, EPUB, web pages, images, audio and video. A fast local MCP server and CLI. Nothing is uploaded and no API key is needed.',
			'zh-Hant':
				'任何檔案轉為供 AI 代理使用的整潔 Markdown：PDF、Word、PowerPoint、Excel、EPUB、網頁、圖片、音訊及影片。在你電腦上運行的高速 MCP 伺服器及命令列工具，不會上載任何檔案，亦無需 API 金鑰。',
		},
	},
	{
		name: 'repomap',
		url: 'https://github.com/SylphxAI/repomap',
		summary: {
			en: 'A map of your codebase for AI agents: code graph, search, call paths and change impact. No API key.',
			'zh-Hant': '為 AI 代理而設的程式碼地圖：程式碼關係圖、搜尋、呼叫路徑及改動影響。無需 API 金鑰。',
		},
	},
	{
		name: 'lockdocs',
		url: 'https://github.com/SylphxAI/lockdocs',
		summary: {
			en: 'Exact-version library docs from your lockfile — local, offline, no rate limits.',
			'zh-Hant': '按你的鎖定檔取得完全對應版本的函式庫文件：在本機離線運行，沒有請求次數限制。',
		},
	},
	{
		name: 'firestore_odm',
		url: 'https://github.com/SylphxAI/firestore_odm',
		summary: {
			en: 'Type-safe Firestore ODM for Flutter and Dart — maintained successor to cloud_firestore_odm.',
			'zh-Hant':
				'為 Flutter 及 Dart 而設的型別安全 Firestore ODM — 持續維護的 cloud_firestore_odm 繼任套件。',
		},
	},
]
