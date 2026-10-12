export function getLocalizedNewsField(news, field, language) {
	const original = news?.[field] ?? "";

	if (language !== "pt") {
		return original;
	}

	const translation = news?.[`${field}_pt`];

	return typeof translation === "string" && translation.trim()
		? translation
		: original;
}
