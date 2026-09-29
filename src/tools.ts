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
		name: 'skills',
		url: 'https://github.com/SylphxAI/skills',
		summary: {
			en: 'Reusable, organization-neutral Agent Skills for product, engineering, operations, design, and research work.',
			'zh-Hant': '可重複使用、不限機構的代理技能，涵蓋產品、工程、營運、設計及研究工作。',
		},
	},
	{
		name: 'Mark',
		url: 'https://mark.sylphx.com',
		summary: {
			en: 'Beautiful README images from one URL: banners, badges, typing text, tech icons and GitHub stats cards. Free, no token, no signup.',
			'zh-Hant':
				'一個網址生成精美的 README 圖像：橫幅、徽章、打字動畫文字、技術圖示及 GitHub 統計卡。免費，無需權杖，無需註冊。',
		},
	},
]
