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
	terms: { en: 'Terms of use', 'zh-Hant': '使用條款' },
	keyTerms: { en: 'Key terms', 'zh-Hant': '主要條款' },
	termsIntro: {
		en: 'The points below matter most. The full terms follow and are the ones that apply.',
		'zh-Hant': '以下是最重要的幾點。完整條款列於其後，並以完整條款為準。',
	},
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
		en: 'Email us and a person will read your message. Please include the app name and your device.',
		'zh-Hant': '請電郵聯絡我們，會有專人閱讀你的訊息。請註明應用程式名稱及你使用的裝置。',
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
		en: 'Under UK data protection law you can ask for a copy of the personal information we hold about you, and ask us to correct it, delete it, restrict how we use it, or give it to you in a portable form. These rights have conditions and exceptions set by law. A parent or guardian can make these requests for a child, and can ask us to stop collecting a child’s information. We may ask for information to confirm who you are. You can complain to the Information Commissioner’s Office (ico.org.uk).',
		'zh-Hant':
			'根據英國資料保護法例，你可要求取得我們持有關於你的個人資料副本，亦可要求我們更正、刪除、限制使用，或以可攜形式向你提供該等資料。這些權利受法律所訂的條件及例外情況規限。家長或監護人可代兒童提出這些要求，並可要求我們停止收集兒童的資料。我們可能要求你提供資料以核實身分。你可向英國資訊專員辦公室（ico.org.uk）投訴。',
	},
	rightToObject: { en: 'Your right to object', 'zh-Hant': '你的反對權' },
	rightToObjectBody: {
		en: 'Where we rely on our legitimate interests, you can object to our use of your personal information on grounds relating to your situation, and we stop unless we have compelling legitimate grounds or need it for a legal claim.',
		'zh-Hant':
			'如我們以正當利益為依據使用你的個人資料，你可基於與你個人情況有關的理由提出反對；除非我們有凌駕性的正當理由，或需要該等資料處理法律申索，否則我們會停止使用。',
	},
	changes: { en: 'Changes to this policy', 'zh-Hant': '政策修訂' },
	changesBody: {
		en: 'We may update this policy. We post the new version on this page with its date. If we plan to use personal information for a new purpose, we tell you before we do.',
		'zh-Hant':
			'我們可更新本政策，並會在本頁公布新版本及其日期。如我們計劃把個人資料用於新的用途，會在使用前通知你。',
	},
	contact: { en: 'Contact', 'zh-Hant': '聯絡' },
	contactBody: {
		en: 'Questions about privacy go to {email}.',
		'zh-Hant': '有關私隱的查詢，請電郵至 {email}。',
	},
	repository: { en: 'Repository', 'zh-Hant': '程式庫' },
	documentation: { en: 'Documentation', 'zh-Hant': '文件' },
	githubStars: { en: 'GitHub stars', 'zh-Hant': 'GitHub 星數' },
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
