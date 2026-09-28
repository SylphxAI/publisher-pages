/**
 * The Sylphx brand home ([SylphxAI/brand](https://github.com/SylphxAI/brand)),
 * as these pages consume it.
 *
 * scripts/sync-brand.sh copies the files into `vendor/brand/` and records the
 * commit and their hashes in `vendor/brand/SOURCE`; the build serves them
 * under `BRAND_PREFIX`. Nothing here redraws, re-colours or re-types a brand
 * file, and no value is picked by hand (owner standards/experience.md,
 * "Brand home").
 */

/** Served path of the vendored brand home. */
export const BRAND_PREFIX = '/apps/_assets/brand'
/** Served path of the vendored IBM Plex files the sheet loads. */
export const FONT_PREFIX = `${BRAND_PREFIX}/fonts`

const SVG = `${BRAND_PREFIX}/logo/svg`
const FAVICON = `${BRAND_PREFIX}/logo/favicon`

/** The header lockup: colour on light surfaces, colour-on-dark on dark ones. */
export const LOCKUP = {
	light: `${SVG}/sylphx-lockup-colour.svg`,
	dark: `${SVG}/sylphx-lockup-colour-on-dark.svg`,
}

/** The lockup file's own view box, so the header can reserve the right box. */
const LOCKUP_BOX = 4187.978 / 1055.05
/** The lockup's height in the header, and the width that keeps its ratio. */
export const LOCKUP_HEIGHT = 26
export const LOCKUP_WIDTH = Math.round(LOCKUP_HEIGHT * LOCKUP_BOX)

/** One `<link>` of the head, in the home's preferred order. */
export interface BrandIcon {
	rel: string
	href: string
	sizes: string
	type?: string
}

/** Browser icons from the home: the mark, then the app and store sizes. */
export const ICONS: BrandIcon[] = [
	{ rel: 'icon', href: `${FAVICON}/favicon.ico`, sizes: '16x16 32x32 48x48' },
	{ rel: 'icon', href: `${FAVICON}/favicon.svg`, type: 'image/svg+xml', sizes: 'any' },
	{ rel: 'icon', href: `${FAVICON}/favicon-16.png`, type: 'image/png', sizes: '16x16' },
	{ rel: 'icon', href: `${FAVICON}/favicon-32.png`, type: 'image/png', sizes: '32x32' },
	{ rel: 'icon', href: `${FAVICON}/favicon-48.png`, type: 'image/png', sizes: '48x48' },
	{ rel: 'icon', href: `${FAVICON}/favicon-192.png`, type: 'image/png', sizes: '192x192' },
	{ rel: 'icon', href: `${FAVICON}/favicon-512.png`, type: 'image/png', sizes: '512x512' },
	{ rel: 'apple-touch-icon', href: `${FAVICON}/apple-touch-icon-180.png`, sizes: '180x180' },
]

/** The head's bookmark and home-screen icons. */
export function iconLinks(): string {
	return ICONS.map(
		(i) => `<link rel="${i.rel}" href="${i.href}"${i.type ? ` type="${i.type}"` : ''} sizes="${i.sizes}">`,
	).join('\n\t\t')
}
