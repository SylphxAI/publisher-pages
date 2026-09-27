import type { Text } from './content'

/**
 * Terms of use for every app published here, at `/apps/{app}/terms`.
 * Placeholders: {app}, {legal}, {number}, {office}, {email}.
 *
 * Drafted to owner standards/commercial.md "Legal surface": the widest terms
 * the law of England and Wales enforces, with the consumer rights, the
 * death, injury and fraud carve-outs, and Apple's minimum EULA terms kept.
 */
export const TERMS_UPDATED = '2026-09-27'

export const KEY_TERMS: Text[] = [
	{
		en: '{app} is licensed to you, not sold. An adult accepts these terms, and a child uses {app} under that adult’s supervision.',
		'zh-Hant': '{app}是授權你使用，而非出售。這些條款須由成年人接受；兒童須在該成年人監督下使用{app}。',
	},
	{
		en: 'Subscriptions are bought, renewed, cancelled and refunded through the app store you used, under its rules.',
		'zh-Hant': '訂閱的購買、續期、取消及退款，均經你使用的應用程式商店按其規則處理。',
	},
	{
		en: 'We may change, add or remove content, features and prices. If a change materially reduces a paid subscription, you can cancel it.',
		'zh-Hant': '我們可更改、新增或移除內容、功能及價格。如某項更改令付費訂閱的內容大幅減少，你可以取消訂閱。',
	},
	{
		en: 'Apart from the rights the law gives you, {app} is provided as it is, and we are not responsible for loss we could not foresee or for business loss.',
		'zh-Hant': '除法律賦予你的權利外，{app}按現狀提供；對無法預見的損失或業務損失，我們概不負責。',
	},
	{
		en: 'If you are not a consumer (for example, a school), our liability is capped at the fees paid in the previous 12 months and claims must be brought within one year.',
		'zh-Hant':
			'如你並非消費者（例如學校），我們的責任以之前 12 個月已付費用為上限，而任何申索須在一年內提出。',
	},
	{
		en: 'The law of England and Wales applies. Nothing in these terms affects your statutory rights as a consumer.',
		'zh-Hant': '這些條款受英格蘭及威爾斯法律管轄，並不影響你作為消費者的法定權利。',
	},
]

export const TERMS_SECTIONS: { heading: Text; body: Text[] }[] = [
	{
		heading: { en: 'About these terms', 'zh-Hant': '關於這些條款' },
		body: [
			{
				en: 'These terms are an agreement between you and {legal} (“we”, “us”), company number {number}, registered office {office}, for the {app} app and its content. By downloading or using {app} you accept them. Only an adult can accept them: if a child uses {app}, the parent or guardian who lets them accepts these terms and is responsible for that use. The privacy policy explains how we handle personal information.',
				'zh-Hant':
					'這些條款是你與{legal}（「我們」，公司編號{number}，註冊辦事處位於 {office}）之間就{app}應用程式及其內容訂立的協議。下載或使用{app}，即表示你接受這些條款。只有成年人可接受這些條款：如兒童使用{app}，容許其使用的家長或監護人即接受這些條款，並須為該使用負責。私隱政策說明我們如何處理個人資料。',
			},
		],
	},
	{
		heading: { en: 'Your licence', 'zh-Hant': '你的使用授權' },
		body: [
			{
				en: 'We give you a personal, non-exclusive, non-transferable and revocable licence to use {app} for private, non-commercial purposes on devices you own or control, as the app store’s usage rules allow. We and our licensors keep all other rights in {app} and its content. You must not copy, modify, sell, rent, lend or distribute {app}, or reverse engineer it except where the law allows this despite these terms.',
				'zh-Hant':
					'我們授予你個人、非獨家、不可轉讓及可撤銷的授權，讓你在你擁有或控制的裝置上，按應用程式商店的使用規則，為私人及非商業用途使用{app}。{app}及其內容的所有其他權利，均由我們及我們的授權人保留。除法律在這些條款以外仍准許的情況外，你不得複製、修改、出售、出租、出借或分發{app}，亦不得對其進行逆向工程。',
			},
		],
	},
	{
		heading: { en: 'Subscriptions and payment', 'zh-Hant': '訂閱及付款' },
		body: [
			{
				en: 'Some content needs a paid subscription, bought inside the app from the App Store or Google Play. The store takes the payment and shows the price, including any tax, before you buy. A subscription renews automatically at the end of each period until you cancel it in your store account; cancelling stops the next renewal, and access continues until the end of the period you paid for.',
				'zh-Hant':
					'部分內容需要付費訂閱，須在應用程式內經 App Store 或 Google Play 購買。商店負責收款，並在你購買前顯示連稅價格。訂閱會在每期完結時自動續期，直至你在商店帳戶中取消；取消後不會再續期，你可繼續使用至已付款期間完結。',
			},
			{
				en: 'We may change subscription prices. A new price applies from your next renewal after the store tells you about it, and you can cancel before then.',
				'zh-Hant': '我們可調整訂閱價格。新價格在商店通知你之後的下一次續期起生效，你可在此之前取消。',
			},
		],
	},
	{
		heading: { en: 'Cancelling and refunds', 'zh-Hant': '取消及退款' },
		body: [
			{
				en: 'Refunds are handled by the store you bought from, under its refund policy and the law of your country. If you are a consumer in the UK or the EU, you have a 14-day right to cancel a purchase of digital content; when you ask for access to begin straight away and acknowledge that you lose this right, it ends once access begins, as the law allows. Otherwise, payments are not refundable except where the store’s policy or the law says so.',
				'zh-Hant':
					'退款由你購買時使用的商店按其退款政策及你所在國家的法律處理。如你是英國或歐盟的消費者，你就購買數碼內容享有 14 日取消權；如你要求立即開始使用，並確認你因此會失去這項權利，則按法律所容許，該權利在開始使用時即告終止。除此以外，除商店政策或法律另有規定外，已付款項不設退款。',
			},
		],
	},
	{
		heading: { en: 'Changes to {app}', 'zh-Hant': '{app}的更改' },
		body: [
			{
				en: 'We may update, change, add or remove lessons, features and other content, and we may stop offering {app}, for example to improve it, to keep it secure, or to meet legal or store requirements. If a change materially reduces what a running paid subscription gives you, we tell you, and you can cancel it. If we stop offering content you have paid for, we give reasonable notice and refund the amount paid for the period you can no longer use.',
				'zh-Hant':
					'我們可更新、更改、新增或移除課程、功能及其他內容，亦可停止提供{app}，例如為了改善、保障安全，或符合法律或商店要求。如某項更改令正在生效的付費訂閱內容大幅減少，我們會通知你，你可以取消訂閱。如我們停止提供你已付費的內容，會給予合理通知，並退還你無法再使用期間的已付款項。',
			},
		],
	},
	{
		heading: { en: 'Using {app}', 'zh-Hant': '使用{app}' },
		body: [
			{
				en: 'Do not misuse {app}: do not interfere with it, try to get around its parent gate or purchase checks, or use it unlawfully. We may suspend or end your licence at once if you break these terms, and for any other reason on reasonable notice. If we end it for a reason other than your breach, we refund the amount paid for the unused period of a subscription.',
				'zh-Hant':
					'請勿濫用{app}：不得干擾其運作、試圖繞過家長關卡或購買核查，亦不得作任何違法用途。如你違反這些條款，我們可即時暫停或終止你的授權；基於任何其他理由，我們亦可在給予合理通知後終止。如終止並非因你違反條款，我們會退還訂閱未使用期間的已付款項。',
			},
		],
	},
	{
		heading: { en: 'Our responsibility to you', 'zh-Hant': '我們對你的責任' },
		body: [
			{
				en: '{app} is provided as it is and as available. Apart from the rights the law gives you, we make no promise that it will be uninterrupted or free of errors, that it will suit a particular purpose, or about the learning results any child will achieve.',
				'zh-Hant':
					'{app}按現狀及可供使用的狀態提供。除法律賦予你的權利外，我們不保證{app}不會中斷或沒有錯誤、適合某項特定用途，亦不保證任何兒童可取得的學習成果。',
			},
			{
				en: 'If you are a consumer, the law gives you rights over digital content: it must be as described, fit for purpose and of satisfactory quality, and nothing in these terms affects those rights. If digital content we supply damages your device or other digital content, and this happens because we did not use reasonable care and skill, we will repair the damage or compensate you.',
				'zh-Hant':
					'如你是消費者，法律就數碼內容賦予你權利：內容須與描述相符、適合用途及質量令人滿意，這些條款並不影響該等權利。如我們提供的數碼內容損壞你的裝置或其他數碼內容，而原因是我們未有以合理的謹慎及技能行事，我們會修復損壞或向你作出賠償。',
			},
			{
				en: 'We are not responsible for loss that was not foreseeable when you accepted these terms, for loss caused by events outside our reasonable control, or for any business loss: {app} is for private use.',
				'zh-Hant':
					'對你接受這些條款時無法預見的損失、因我們合理控制範圍以外的事件所造成的損失，或任何業務損失，我們概不負責：{app}只供私人使用。',
			},
			{
				en: 'If you use {app} other than as a consumer, for example as a school: all terms implied by law are excluded; we are not liable for indirect or consequential loss, or for loss of profits, revenue, goodwill or data; our total liability in any 12 months is limited to the fees paid for {app} in the 12 months before the event giving rise to the claim; you indemnify us against claims and losses arising from your use of {app} in breach of these terms or the law; any claim must be brought within one year of the event giving rise to it; and claims may be brought only individually, not as part of a group or representative action. Each of these applies to the extent the law allows.',
				'zh-Hant':
					'如你並非以消費者身分使用{app}，例如學校：法律隱含的所有條款均予排除；我們不對間接或相應而生的損失，或利潤、收入、商譽或資料的損失負責；我們在任何 12 個月內的總責任，以引致申索事件發生前 12 個月內就{app}已付的費用為上限；你須就因你違反這些條款或法律使用{app}而引起的申索及損失向我們作出彌償；任何申索須在引致申索的事件發生後一年內提出；而申索只可個別提出，不得以集體或代表訴訟方式提出。以上各項均在法律容許的範圍內適用。',
			},
			{
				en: 'Nothing in these terms excludes or limits our liability for death or personal injury caused by our negligence, for fraud or fraudulent misrepresentation, or for anything else the law does not allow us to exclude or limit.',
				'zh-Hant':
					'這些條款並不排除或限制我們因疏忽導致死亡或人身傷害、欺詐或欺詐性失實陳述的責任，或法律不容許排除或限制的任何其他責任。',
			},
		],
	},
	{
		heading: { en: 'If you downloaded {app} from the App Store', 'zh-Hant': '如你從 App Store 下載{app}' },
		body: [
			{
				en: 'These terms are between you and us, not Apple, and Apple is not responsible for {app} or its content. Your licence covers Apple-branded products you own or control, as the App Store usage rules allow. Apple has no obligation to provide maintenance or support for {app}. If {app} fails to meet an applicable warranty, you may tell Apple, and Apple will refund the purchase price, if any; to the extent the law allows, Apple has no other warranty obligation for {app}. We, not Apple, handle any claim about {app} or your use of it, including product liability claims, claims that it fails to meet a legal or regulatory requirement, consumer protection claims, and claims that it infringes someone else’s intellectual property.',
				'zh-Hant':
					'這些條款是你與我們之間的協議，而非與 Apple 之間的協議；Apple 不對{app}或其內容負責。你的授權涵蓋你擁有或控制、並符合 App Store 使用規則的 Apple 品牌產品。Apple 沒有義務為{app}提供維護或支援。如{app}未能符合任何適用的保證，你可通知 Apple，Apple 會退還購買價（如有）；在法律容許的範圍內，Apple 對{app}並無其他保證責任。有關{app}或你使用{app}的任何申索，包括產品責任申索、未能符合法律或規管要求的申索、消費者保障申索，以及侵犯他人知識產權的申索，均由我們而非 Apple 處理。',
			},
			{
				en: 'You confirm that you are not in a country subject to a US Government embargo or designated by the US Government as a “terrorist supporting” country, and that you are not on any US Government list of prohibited or restricted parties. Apple and its subsidiaries are third-party beneficiaries of these terms and may enforce them against you. Otherwise, no one other than you and us has any right to enforce these terms.',
				'zh-Hant':
					'你確認你並非身處受美國政府禁運或被美國政府列為「支持恐怖主義」的國家，亦不在美國政府任何禁止或受限制人士名單上。Apple 及其附屬公司是這些條款的第三方受益人，可向你執行這些條款。除此以外，除你與我們外，任何人均無權執行這些條款。',
			},
		],
	},
	{
		heading: { en: 'Changes to these terms', 'zh-Hant': '條款的修訂' },
		body: [
			{
				en: 'We may change these terms, for example to reflect a change in the law, in {app} or in how we provide it. We post the new version here with its date. If a change materially affects you, we tell you before it applies, in the app or on this page, and you can stop using {app} and cancel any subscription before then.',
				'zh-Hant':
					'我們可修訂這些條款，例如為反映法律、{app}或我們提供{app}方式的改變。新版本會連同日期在本頁公布。如修訂對你有重大影響，我們會在生效前於應用程式內或本頁通知你，你可在此之前停止使用{app}並取消任何訂閱。',
			},
		],
	},
	{
		heading: { en: 'General', 'zh-Hant': '一般條款' },
		body: [
			{
				en: 'We may transfer our rights and obligations under these terms to another organisation; we will tell you, and your rights will not be reduced. You may not transfer yours. If a court finds part of these terms unenforceable, the rest stays in force. If we do not enforce a right straight away, we can still enforce it later.',
				'zh-Hant':
					'我們可將這些條款下的權利及義務轉讓予其他機構；我們會通知你，而你的權利不會因此減少。你不得轉讓你的權利及義務。如法院裁定這些條款的任何部分不可執行，其餘部分仍然有效。即使我們沒有即時執行某項權利，日後仍可執行。',
			},
		],
	},
	{
		heading: { en: 'Law and courts', 'zh-Hant': '適用法律及法院' },
		body: [
			{
				en: 'These terms are governed by the law of England and Wales. If you are a consumer, you can bring proceedings in England and Wales or where you live, and you keep the protection of the mandatory laws of the country where you live. Anyone else submits to the exclusive jurisdiction of the courts of England and Wales. Questions about these terms go to {email}.',
				'zh-Hant':
					'這些條款受英格蘭及威爾斯法律管轄。如你是消費者，你可在英格蘭及威爾斯或你居住的地方提出訴訟，並繼續享有你居住國家強制性法律的保障。其他人士均服從英格蘭及威爾斯法院的專屬司法管轄權。有關這些條款的查詢，請電郵至{email}。',
			},
		],
	},
]
