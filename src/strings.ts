import type { Text } from './content'

/** Interface copy shared by every page. */
export const UI = {
	appsTitle: { en: 'Built on Sylphx', 'zh-Hant': '建基於 Sylphx' },
	appsIntro: {
		en: 'Apps published by Sylphx and run on the Sylphx platform. Each one keeps its own name and is sold through its app store.',
		'zh-Hant':
			'由 Sylphx 發佈、在 Sylphx 平台上運行的應用程式。每個應用程式都保留自己的名稱，並透過應用程式商店銷售。',
	},
	openSourceTitle: { en: 'Open source', 'zh-Hant': '開源項目' },
	comingSoon: { en: 'Coming soon', 'zh-Hant': '即將推出' },
	available: { en: 'Available', 'zh-Hant': '已推出' },
	visitSite: { en: 'Visit site', 'zh-Hant': '前往網站' },
	learnMore: { en: 'Learn more', 'zh-Hant': '了解更多' },
	privacy: { en: 'Privacy policy', 'zh-Hant': '私隱政策' },
	support: { en: 'Support', 'zh-Hant': '支援' },
	allApps: { en: 'All apps', 'zh-Hant': '所有應用程式' },
	notYetInStores: {
		en: 'Not in the stores yet. This page will link to the App Store and Google Play at release.',
		'zh-Hant': '尚未上架。推出時，本頁會提供 App Store 及 Google Play 連結。',
	},
	appStore: { en: 'App Store', 'zh-Hant': 'App Store' },
	googlePlay: { en: 'Google Play', 'zh-Hant': 'Google Play' },
	web: { en: 'Open in browser', 'zh-Hant': '在瀏覽器開啟' },
	contactUs: { en: 'Contact us', 'zh-Hant': '聯絡我們' },
	supportIntro: {
		en: 'Email us and a person will reply, usually within two working days. Please include the app name and your device.',
		'zh-Hant': '請電郵聯絡我們，會有專人回覆，一般在兩個工作天內。請註明應用程式名稱及你使用的裝置。',
	},
	faq: { en: 'Common questions', 'zh-Hant': '常見問題' },
	lastUpdated: { en: 'Last updated', 'zh-Hant': '最後更新' },
	whoWeAre: { en: 'Who we are', 'zh-Hant': '我們是誰' },
	whoWeAreBody: {
		en: '{app} is published by {legal}, a company registered in {jurisdiction} (company number {number}), registered office {office}. {legal} is the data controller for the app.',
		'zh-Hant':
			'{app} 由 {legal} 發佈。{legal} 是在{jurisdiction}註冊的公司（公司編號 {number}），註冊辦事處位於 {office}，並是本應用程式的資料控制者。',
	},
	yourRights: { en: 'Your rights', 'zh-Hant': '你的權利' },
	yourRightsBody: {
		en: 'Under UK data protection law you can ask to see, correct or delete personal information we hold about you or your child, and you can object to how we use it. You can also complain to the Information Commissioner’s Office (ico.org.uk).',
		'zh-Hant':
			'根據英國資料保護法例，你可要求查閱、更正或刪除我們持有關於你或你孩子的個人資料，亦可反對我們使用資料的方式。你亦可向英國資訊專員辦公室（ico.org.uk）投訴。',
	},
	changes: { en: 'Changes to this policy', 'zh-Hant': '政策修訂' },
	changesBody: {
		en: 'When this policy changes we update this page and the date above. A change that affects how we use existing information is also shown in the app before it applies.',
		'zh-Hant':
			'本政策如有修訂，我們會更新本頁及上方日期。若修訂影響我們使用現有資料的方式，亦會在生效前於應用程式內通知。',
	},
	contact: { en: 'Contact', 'zh-Hant': '聯絡' },
	contactBody: {
		en: 'Questions about privacy go to {email}.',
		'zh-Hant': '有關私隱的查詢，請電郵至 {email}。',
	},
	repository: { en: 'Repository', 'zh-Hant': '程式庫' },
	documentation: { en: 'Documentation', 'zh-Hant': '文件' },
	mcpRegistry: { en: 'MCP registry', 'zh-Hant': 'MCP 登記名稱' },
	fromThePlatform: { en: 'From the platform', 'zh-Hant': '平台' },
	footerLine: {
		en: '© {year} {legal}. Registered in {jurisdiction}, company number {number}.',
		'zh-Hant': '© {year} {legal}。於{jurisdiction}註冊，公司編號 {number}。',
	},
	skip: { en: 'Skip to content', 'zh-Hant': '跳至內容' },
	language: { en: 'Language', 'zh-Hant': '語言' },
	notFound: { en: 'Page not found', 'zh-Hant': '找不到頁面' },
	notFoundBody: {
		en: 'This page does not exist. See all apps instead.',
		'zh-Hant': '此頁面不存在。請瀏覽所有應用程式。',
	},
} satisfies Record<string, Text>
