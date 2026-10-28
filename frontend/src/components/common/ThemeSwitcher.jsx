import { Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePreferences } from "@/context/PreferencesContext";

export default function ThemeSwitcher() {
	const { resolvedTheme, setTheme, t } = usePreferences();

	return (
		<Button
			type="button"
			variant="ghost"
			size="icon"
			aria-label={
				resolvedTheme === "dark"
					? t("settings.switchToLight")
					: t("settings.switchToDark")
			}
			onClick={() =>
				setTheme(resolvedTheme === "dark" ? "light" : "dark")
			}
		>
			{resolvedTheme === "dark" ? <Sun /> : <Moon />}
		</Button>
	);
}
