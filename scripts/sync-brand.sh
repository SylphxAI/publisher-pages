#!/usr/bin/env bash
#
# Vendors the company brand home into vendor/brand/.
#
#   scripts/sync-brand.sh <path to a SylphxAI/brand checkout>
#
# Run it against the brand home at the commit you want to consume, then commit
# the result with the change that uses it. It copies exactly the files this
# site renders and writes vendor/brand/SOURCE: the commit the files came from
# and the SHA-256 of every one of them, which tests/brand.test.ts checks.
#
# Nothing here redraws, re-colours or re-types anything (owner
# standards/experience.md, "Brand home"): a value this site needs and the home
# does not hold is added to the home, not invented here.
set -euo pipefail

src=${1:-}
if [[ -z $src || ! -d $src/.git ]]; then
	echo "usage: scripts/sync-brand.sh <path to a SylphxAI/brand checkout>" >&2
	exit 2
fi
src=$(cd "$src" && pwd)
cd "$(dirname "$0")/.."

# The brand home's files this site consumes. Paths are the home's; the vendored
# copy keeps them.
files=(
	tokens/brand.css
	fonts/fonts.css
	fonts/OFL.txt
	fonts/ibm-plex-sans-latin-400-normal.woff2
	fonts/ibm-plex-sans-latin-500-normal.woff2
	fonts/ibm-plex-sans-latin-600-normal.woff2
	fonts/ibm-plex-sans-latin-ext-400-normal.woff2
	fonts/ibm-plex-sans-latin-ext-500-normal.woff2
	fonts/ibm-plex-sans-latin-ext-600-normal.woff2
	fonts/ibm-plex-mono-latin-400-normal.woff2
	fonts/ibm-plex-mono-latin-500-normal.woff2
	fonts/ibm-plex-mono-latin-ext-400-normal.woff2
	fonts/ibm-plex-mono-latin-ext-500-normal.woff2
	logo/svg/sylphx-lockup-colour.svg
	logo/svg/sylphx-lockup-colour-on-dark.svg
	logo/favicon/favicon.svg
	logo/favicon/favicon.ico
	logo/favicon/favicon-16.png
	logo/favicon/favicon-32.png
	logo/favicon/favicon-48.png
	logo/favicon/favicon-192.png
	logo/favicon/favicon-512.png
	logo/favicon/apple-touch-icon-180.png
)

sha=$(git -C "$src" rev-parse HEAD)
out=vendor/brand
rm -rf "$out"
mkdir -p "$out"

sha256() { sha256sum "$1" | cut -d' ' -f1; }

# The home's own manifest covers its logo files; CI in that repository checks it
# against the generator, so matching it ties the vendored bytes to the drawing.
manifest=$src/logo/MANIFEST.sha256

{
	echo "# The Sylphx brand home, as consumed by these pages."
	echo "# Written by scripts/sync-brand.sh; do not edit."
	echo "repository: SylphxAI/brand"
	echo "commit: $sha"
	echo "sha256:"
} >"$out/SOURCE.tmp"

for file in "${files[@]}"; do
	if [[ ! -f $src/$file ]]; then
		echo "sync-brand: $file is missing from $src (commit $sha)" >&2
		exit 1
	fi
	mkdir -p "$out/$(dirname "$file")"
	cp "$src/$file" "$out/$file"
	sum=$(sha256 "$out/$file")
	if [[ -f $manifest ]]; then
		want=$(grep -F " $file" "$manifest" | cut -d' ' -f1 || true)
		if [[ -n $want && $want != "$sum" ]]; then
			echo "sync-brand: $file is $sum, the home's manifest says $want" >&2
			exit 1
		fi
	fi
	printf '%s  %s\n' "$sum" "$file" >>"$out/SOURCE.tmp"
done

mv "$out/SOURCE.tmp" "$out/SOURCE"
echo "vendored ${#files[@]} files from SylphxAI/brand $sha into $out/"
