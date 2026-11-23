import { readFileSync } from 'node:fs'

// Parse the same TOML the platform consumes rather than matching source formatting.
export const manifest = Bun.TOML.parse(readFileSync(new URL('../sylphx.toml', import.meta.url), 'utf8')) as {
	build?: unknown
	services: Array<{
		name: string
		public_networking: boolean
		path_prefixes: string[]
		port?: number
		instance_type?: string
		health?: unknown
		static: {
			build_command: string
			output_dir: string
			spa_fallback: boolean
			not_found: string
			clean_urls: boolean
			trailing_slash: string
			headers: Array<{ path: string; set: Record<string, string> }>
			redirects: Array<{ from: string; to: string; status: number }>
		}
	}>
	domains: Array<{ hostname: string; service: string }>
}

const staticService = manifest.services[0]?.static
if (!staticService) throw new Error('publisher-pages must declare a static service')
export const staticSite = staticService

export const security = staticSite.headers.find(({ path }) => path === '/*')?.set
export const csp = security?.['content-security-policy'] ?? ''
export const cspDirective = (name: string) =>
	csp
		.split(';')
		.map((directive) => directive.trim().split(/\s+/))
		.find(([directive]) => name === directive)
		?.slice(1) ?? []
