import type { Text } from './content'

/** An open-source tool Sylphx publishes. Descriptions follow each repository's GitHub description. */
export interface Tool {
	name: string
	url: string
	summary: Text
}

/** The "Also from Sylphx" list on the apps hub. */
export const TOOLS: Tool[] = [
	{
		name: 'anymd',
		url: 'https://github.com/SylphxAI/anymd',
		summary: {
			en: 'Any file → clean Markdown for AI agents: PDF, Word, PowerPoint, Excel, EPUB, HTML and web pages, images (OCR), audio and video (metadata, subtitles, transcripts). A fast Rust MCP server and CLI that runs on your machine. No API key.',
			'zh-Hant':
				'任何檔案轉為供 AI 代理使用的整潔 Markdown：PDF、Word、PowerPoint、Excel、EPUB、HTML 及網頁、圖片（OCR）、音訊及影片（中繼資料、字幕、逐字稿）。以 Rust 編寫、在你的電腦上運行的高速 MCP 伺服器及命令列工具。無需 API 金鑰。',
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
		name: 'anyagents',
		url: 'https://github.com/SylphxAI/anyagents',
		summary: {
			en: 'Run any coding agent harness as a long-lived agent with durable mailboxes, real-time steering, multi-agent groups, schedules, anti-detect browser, and Telegram.',
			'zh-Hant':
				'將任何編碼代理框架作為長駐代理運行，具備持久化信箱、即時轉向、多代理群組、排程、反偵測瀏覽器及 Telegram 整合。',
		},
	},
	{
		name: 'skills',
		url: 'https://github.com/SylphxAI/skills',
		summary: {
			en: 'Reusable, organization-neutral Agent Skills for product, engineering, operations, design, and research work.',
			'zh-Hant': '可重複使用、不限機構的代理技能，涵蓋產品、工程、營運、設計及研究工作。',
		},
	},
	{
		name: 'firestore_odm',
		url: 'https://github.com/SylphxAI/firestore_odm',
		summary: {
			en: 'Type-safe Firestore ODM for Flutter and Dart — maintained successor to cloud_firestore_odm.',
			'zh-Hant': '為 Flutter 及 Dart 而設的型別安全 Firestore ODM — 持續維護的 cloud_firestore_odm 繼任套件。',
		},
	},
	{
		name: 'Google Photos Delete Tool',
		url: 'https://github.com/SylphxAI/Google-Photos-Delete-Tool',
		summary: {
			en: 'Google Photos duplicate finder and bulk delete tool: find and delete duplicate photos safely with dry run and empty trash. Runs in your browser.',
			'zh-Hant': 'Google 相簿重複相片搜尋及批量刪除工具：支援模擬執行及清空垃圾桶，在你的瀏覽器內安全運行。',
		},
	},
	{
		name: 'mcp-kit',
		url: 'https://github.com/SylphxAI/mcp-kit',
		summary: {
			en: 'Shared parts of Sylphx MCP servers: an rmcp stdio server, client setup, npm launcher and a reusable release workflow.',
			'zh-Hant': 'Sylphx MCP 伺服器的共用組件：rmcp 標準輸入輸出伺服器、客戶端設定、npm 啟動器及可重用發佈工作流。',
		},
	},
]
