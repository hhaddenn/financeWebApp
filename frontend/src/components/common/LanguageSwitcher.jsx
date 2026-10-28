import { Button } from "@/components/ui/button";
import { usePreferences } from "@/context/PreferencesContext";

export default function LanguageSwitcher() {
	const { language, setLanguage } = usePreferences();

	return (
		<div className="flex items-center gap-2">
			<Button
				type="button"
				variant={language === "pt" ? "default" : "outline"}
				onClick={() => setLanguage("pt")}
				aria-pressed={language === "pt"}
			>
				PT
			</Button>
			<Button
				type="button"
				variant={language === "en" ? "default" : "outline"}
				onClick={() => setLanguage("en")}
				aria-pressed={language === "en"}
			>
				EN
			</Button>
		</div>
	);
}
