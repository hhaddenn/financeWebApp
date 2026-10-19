import { test } from "vitest";
import assert from "node:assert/strict";

import { getLocalizedNewsField } from "./newsTranslations.js";

const news = {
	title: "New features",
	title_pt: "Novas funcionalidades",
	description: "New improvements available",
	description_pt: "",
};

test("returns Portuguese translation", () => {
	assert.equal(
		getLocalizedNewsField(news, "title", "pt"),
		"Novas funcionalidades",
	);
});

test("returns original English content", () => {
	assert.equal(getLocalizedNewsField(news, "title", "en"), "New features");
});

test("falls back to English when translation is empty", () => {
	assert.equal(
		getLocalizedNewsField(news, "description", "pt"),
		"New improvements available",
	);
});
