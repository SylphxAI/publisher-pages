import type { Text } from './content'

/** Interface copy shared by every page. */
export const UI = {
	appsTitle: { en: 'Built on Sylphx', 'zh-Hant': '建基於 Sylphx' },
	appsPageTitle: { en: 'Products built on Sylphx', 'zh-Hant': '建基於 Sylphx 的產品' },
	appsIntro: {
		en: '{count} products in production on Sylphx: hosting, Postgres, auth and AI from one account.',
		'zh-Hant': '{count} 款產品已在 Sylphx 上運行：一個帳戶即可使用代管、Postgres、驗證及 AI。',
	},
	appsDescription: {
		en: 'Products in production on Sylphx: what each one does, where to find it, and which Sylphx services it runs on.',
		'zh-Hant': '在 Sylphx 上運行的產品：各自的用途、網址，以及所使用的 Sylphx 服務。',
	},
	openSourceTitle: { en: 'Open source', 'zh-Hant': '開源項目' },
	openSourceHeading: { en: 'Open-source tools from Sylphx', 'zh-Hant': 'Sylphx 的開源工具' },
	openSourcePageTitle: {
		en: 'Open-source tools for AI agents and developers',
		'zh-Hant': '為 AI 代理及開發者而設的開源工具',
	},
	openSourceIntro: {
		en: 'Free tools for AI agents and developers, built by Sylphx and published on GitHub under open-source licences.',
		'zh-Hant': '由 Sylphx 打造、以開源授權在 GitHub 發佈的免費工具，供 AI 代理及開發者使用。',
	},
	openSourceDescription: {
		en: 'Free open-source tools for AI agents and developers from Sylphx: what each one does, its licence, and where to get it.',
		'zh-Hant': 'Sylphx 為 AI 代理及開發者而設的免費開源工具：各自的用途、授權及取得方式。',
	},
	surfacesTitle: { en: 'Sylphx SDK and CLI', 'zh-Hant': 'Sylphx SDK 及命令列工具' },
	surfacesIntro: {
		en: 'The platform’s own packages, published on npm and crates.io.',
		'zh-Hant': '平台自家的套件，發佈於 npm 及 crates.io。',
	},
	runsOn: { en: 'Runs on', 'zh-Hant': '運行於' },
	categoryFilter: { en: 'Category', 'zh-Hant': '類別' },
	allCategories: { en: 'All', 'zh-Hant': '全部' },
	earlyAccess: { en: 'Early access', 'zh-Hant': '搶先體驗' },
	getEarlyAccess: { en: 'Get early access', 'zh-Hant': '申請搶先體驗' },
	openSourceChip: { en: 'Open source · {licence}', 'zh-Hant': '開源 · {licence}' },
	github: { en: 'GitHub', 'zh-Hant': 'GitHub' },
	docs: { en: 'Docs', 'zh-Hant': '文件' },
	stars: { en: 'GitHub stars', 'zh-Hant': 'GitHub 星數' },
	opens: { en: '(opens {host})', 'zh-Hant': '（開啟 {host}）' },
	ctaTitle: { en: 'Build yours on Sylphx', 'zh-Hant': '在 Sylphx 打造你的產品' },
	ctaBody: {
		en: 'Hosting, database, auth and AI from one account.',
		'zh-Hant': '一個帳戶，即可使用代管、資料庫、驗證及 AI。',
	},
	startBuilding: { en: 'Start building', 'zh-Hant': '開始建構' },
	readDocs: { en: 'Read the docs', 'zh-Hant': '閱讀文件' },
	signIn: { en: 'Sign in', 'zh-Hant': '登入' },
	navDocs: { en: 'Docs', 'zh-Hant': '文件' },
	navPricing: { en: 'Pricing', 'zh-Hant': '價錢' },
	navChangelog: { en: 'Changelog', 'zh-Hant': '更新日誌' },
	footProduct: { en: 'Product', 'zh-Hant': '產品' },
	footDevelopers: { en: 'Developers', 'zh-Hant': '開發者' },
	footCompany: { en: 'Company', 'zh-Hant': '公司' },
	footLegal: { en: 'Legal', 'zh-Hant': '法律' },
	apiReference: { en: 'API reference', 'zh-Hant': 'API 參考' },
	status: { en: 'Status', 'zh-Hant': '服務狀態' },
	about: { en: 'About', 'zh-Hant': '關於我們' },
	careers: { en: 'Careers', 'zh-Hant': '招聘' },
	contactPage: { en: 'Contact', 'zh-Hant': '聯絡' },
	security: { en: 'Security', 'zh-Hant': '安全' },
	legalTerms: { en: 'Terms', 'zh-Hant': '條款' },
	legalPrivacy: { en: 'Privacy', 'zh-Hant': '私隱' },
	subProcessors: { en: 'Sub-processors', 'zh-Hant': '子處理者' },
	cookies: { en: 'Cookies', 'zh-Hant': 'Cookie' },
	mainNav: { en: 'Sylphx', 'zh-Hant': 'Sylphx' },
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
	allApps: { en: 'All products', 'zh-Hant': '所有產品' },
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
		en: '{app} is published by {legal}, registered in {jurisdiction}, company no. {number}. Registered office: {office}. {legal} is the data controller for the app.',
		'zh-Hant':
			'{app} 由 {legal} 發佈。{legal} 於{jurisdiction}註冊，公司編號 {number}。註冊辦事處：{office}。{legal} 是本應用程式的資料控制者。',
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
	footerLine: {
		en: '© {year} {legal}, registered in {jurisdiction}, company no. {number}. Registered office: {office}. Phone: {phone}.',
		'zh-Hant':
			'© {year} {legal}，於{jurisdiction}註冊，公司編號 {number}。註冊辦事處：{office}。電話：{phone}。',
	},
	skip: { en: 'Skip to content', 'zh-Hant': '跳至內容' },
	language: { en: 'Language', 'zh-Hant': '語言' },
	notFound: { en: 'Page not found', 'zh-Hant': '找不到頁面' },
	notFoundBody: {
		en: 'This page does not exist. See the products built on Sylphx instead.',
		'zh-Hant': '此頁面不存在。請瀏覽建基於 Sylphx 的產品。',
	},
} satisfies Record<string, Text>
