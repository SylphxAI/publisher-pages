import type { Text } from './content'

/** The `/open-source` page: what Sylphx publishes, and what stays closed. Every field has both languages. */

export const OPEN_SOURCE = {
	title: { en: 'What we publish, and what stays closed.', 'zh-Hant': '我們公開甚麼，甚麼保持不公開。' },
	navLabel: { en: 'Open source', 'zh-Hant': '開源項目' },
	description: {
		en: 'What Sylphx actually publishes: the docs set, the generated SDK and contract packages on npm, the CLI distributions, the public API discovery document, our open-source tools and the GitHub org, and what stays closed.',
		'zh-Hant':
			'Sylphx 實際公開的內容：文件、發佈於 npm 的 SDK 及合約套件、命令列工具各發行途徑、公開的 API 探索文件、開源工具及 GitHub 組織，以及保持不公開的部分。',
	},
	intro: {
		en: 'The docs, the generated packages, the CLI, the API discovery document, our tools and the org: every surface anyone can open today, each with its link.',
		'zh-Hant':
			'文件、自動生成的套件、命令列工具、API 探索文件、我們的工具及組織：現時任何人都可開啟的公開內容，每項均附連結。',
	},
	publishedTitle: { en: 'Surfaces you can open right now', 'zh-Hant': '現時可直接開啟的內容' },
	publishedIntro: {
		en: 'Each item names something Sylphx publishes today and where to read it without asking anyone. Nothing here is a mirror of a private repository or a promise about a future release.',
		'zh-Hant':
			'每項都是 Sylphx 現時公開的內容，以及無需向任何人申請即可閱讀的位置。這裏沒有私有儲存庫的鏡像，亦沒有對未來發佈的承諾。',
	},
	toolsTitle: { en: 'Open-source tools', 'zh-Hant': '開源工具' },
	toolsIntro: { en: 'Tools we publish on GitHub.', 'zh-Hant': '我們在 GitHub 發佈的工具。' },
	licenceTitle: { en: 'What licence each package carries', 'zh-Hant': '各套件採用的授權' },
	licence: [
		{
			en: 'The CLI adapter and the contract package declare MIT in the metadata they publish, and the Rust crate is published on crates.io under MIT OR Apache-2.0.',
			'zh-Hant':
				'命令列轉接套件及合約套件在其發佈的中繼資料中聲明採用 MIT；Rust crate 則以 MIT OR Apache-2.0 發佈於 crates.io。',
		},
		{
			en: 'Where a package does not declare a licence in its published metadata, do not assume one. The metadata is the statement, not this page.',
			'zh-Hant': '如套件的中繼資料沒有聲明授權，請勿自行假設。以中繼資料為準，而非本頁。',
		},
		{
			en: 'The platform itself is not published, so nothing here grants a licence to it. This page describes the surfaces you can read, and makes no claim the published packages do not already make for themselves.',
			'zh-Hant':
				'平台本身並未公開，因此本頁不授予平台的任何授權。本頁只描述可供閱讀的內容，不作出已發佈套件本身沒有作出的聲明。',
		},
	],
	closedTitle: { en: 'What is not published', 'zh-Hant': '不公開的部分' },
	closedIntro: {
		en: 'An open source page is only useful if it draws the line. This is where we draw it.',
		'zh-Hant': '開源頁面要清楚劃出界線才有用。以下就是我們的界線。',
	},
	closed: [
		{
			en: 'The platform source. The Rust services, controllers, gateways, runtimes, workers and the storage layer that run the platform are not published, and there is no public repository to browse for them.',
			'zh-Hant':
				'平台原始碼。運行平台的 Rust 服務、控制器、閘道、執行環境、背景工作程式及儲存層均不公開，亦沒有可供瀏覽的公開儲存庫。',
		},
		{
			en: 'The platform website’s own source. The web app that renders those pages lives in a private repository. What is public is the rendered site and its machine-readable entry points, not the code behind it.',
			'zh-Hant':
				'平台網站本身的原始碼。呈現該些頁面的網頁應用程式位於私有儲存庫。公開的是已呈現的網站及其機器可讀入口，而非其背後的程式碼。',
		},
		{
			en: 'Popularity numbers. No star counts, download totals or contributor counts appear on this page. They would not tell you whether the software works.',
			'zh-Hant': '受歡迎程度數字。本頁不顯示星標數、下載總數或貢獻者人數，因為這些數字無法說明軟件是否可用。',
		},
	],
	corrections: {
		en: 'Corrections: if a surface above has moved, or a licence claim here disagrees with a package’s published metadata, mail {email}.',
		'zh-Hant': '更正：如上述內容已搬遷，或本頁的授權說明與套件發佈的中繼資料不符，請電郵至 {email}。',
	},
} satisfies Record<string, Text | Text[]>

/** One public surface: what it is, and the links to read it. */
export interface Surface {
	name: Text
	what: Text
	links: { label: string; url: string }[]
}

/** Every surface is published today; nothing here is a future release. Links are absolute: the platform site and registries own them. */
export const SURFACES: Surface[] = [
	{
		name: { en: 'Published docs set', 'zh-Hant': '已發佈的文件' },
		what: {
			en: 'Quickstart, CLI install and update, deploy, custom domains, configuration and the API reference.',
			'zh-Hant': '快速入門、命令列工具安裝及更新、部署、自訂網域、設定及 API 參考。',
		},
		links: [
			{ label: 'sylphx.com/docs', url: 'https://sylphx.com/docs' },
			{ label: 'API reference', url: 'https://sylphx.com/docs/api-reference' },
		],
	},
	{
		name: { en: 'Machine-readable entry point', 'zh-Hant': '機器可讀入口' },
		what: {
			en: 'One text file that tells tools and agents where the public surfaces are, and states that absence from current discovery means a capability is not available.',
			'zh-Hant': '一個文字檔，告訴工具及代理公開內容的位置，並說明未出現在現行探索內容中的功能即表示不可用。',
		},
		links: [{ label: 'sylphx.com/llms.txt', url: 'https://sylphx.com/llms.txt' }],
	},
	{
		name: { en: 'Generated SDK and contract packages', 'zh-Hant': '自動生成的 SDK 及合約套件' },
		what: {
			en: 'The typed TypeScript SDK and the contract package, published on the public npm registry. They are generated projections of the canonical contract rather than hand-written clients.',
			'zh-Hant':
				'具型別的 TypeScript SDK 及合約套件，發佈於公開 npm 登錄庫。它們是由正式合約自動生成，而非手寫的用戶端。',
		},
		links: [
			{ label: '@sylphx/sdk', url: 'https://www.npmjs.com/package/@sylphx/sdk' },
			{ label: '@sylphx/contract', url: 'https://www.npmjs.com/package/@sylphx/contract' },
		],
	},
	{
		name: { en: 'CLI distributions', 'zh-Hant': '命令列工具發行途徑' },
		what: {
			en: 'One Rust binary, distributed through the curl installer, the npm adapter and native npm packages, and the crate on crates.io.',
			'zh-Hant':
				'單一 Rust 執行檔，經 curl 安裝程式、npm 轉接套件及原生 npm 套件發行，並有 crates.io 上的 crate。',
		},
		links: [
			{ label: '@sylphx/cli', url: 'https://www.npmjs.com/package/@sylphx/cli' },
			{ label: 'crates.io/sylphx-cli', url: 'https://crates.io/crates/sylphx-cli' },
			{ label: 'sylphx.com/docs/cli', url: 'https://sylphx.com/docs/cli#install' },
		],
	},
	{
		name: { en: 'Public API discovery', 'zh-Hant': '公開 API 探索文件' },
		what: {
			en: 'The OpenAPI discovery document the docs reference as the machine copy of the platform API. Reading it can require credentials, which is why the rendered reference is the always-readable copy.',
			'zh-Hant':
				'文件所引用、作為平台 API 機器可讀版本的 OpenAPI 探索文件。讀取可能需要憑證，因此已呈現的參考文件才是隨時可讀的版本。',
		},
		links: [{ label: 'api.sylphx.com/v1/openapi.json', url: 'https://api.sylphx.com/v1/openapi.json' }],
	},
	{
		name: { en: 'Public GitHub org', 'zh-Hant': '公開 GitHub 組織' },
		what: {
			en: 'The org that carries our public repositories, the only community surface we publish.',
			'zh-Hant': '存放我們公開儲存庫的組織，也是我們發佈的唯一社群平台。',
		},
		links: [{ label: 'github.com/SylphxAI', url: 'https://github.com/SylphxAI' }],
	},
]
