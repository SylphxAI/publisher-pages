import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import type { AppContent, Text } from "../src/content";

const app = JSON.parse(
	readFileSync(
		new URL("../content/apps/puzzled.json", import.meta.url),
		"utf8",
	),
) as AppContent;

function bilingual(text: Text) {
	for (const lang of ["en", "zh-Hant"] as const) {
		expect(text[lang].trim().length).toBeGreaterThan(0);
		expect(text[lang]).not.toContain("{email}");
	}
}

test("Puzzled retains its external hub link and immutable product source", () => {
	expect(app.external).toBe("https://puzzled.gg");
	expect(app.source.repo).toBe("SylphxAI/puzzled");
	expect(app.source.path).toBe("publisher/app.json");
	expect(app.source.note).toMatch(
		/SylphxAI\/puzzled@[0-9a-f]{40}:publisher\/app\.json/,
	);
});

test("Puzzled supplies bilingual privacy and support without email placeholders", () => {
	expect(app.support?.email).toBe("hi@puzzled.gg");
	expect(app.privacy?.updated).toMatch(/^\d{4}-\d{2}-\d{2}$/);
	if (!app.privacy || !app.support)
		throw new Error("Missing Puzzled product payload");
	bilingual(app.privacy.summary);
	expect(app.privacy.sections.length).toBeGreaterThan(0);
	for (const section of app.privacy.sections) {
		bilingual(section.heading);
		expect(section.body.length).toBeGreaterThan(0);
		for (const paragraph of section.body) bilingual(paragraph);
	}
	expect(app.support.faq.length).toBeGreaterThan(0);
	for (const faq of app.support.faq) {
		bilingual(faq.q);
		bilingual(faq.a);
	}
});
