import { SidebarTrigger } from "@/components/ui/sidebar";
import LanguageSwitcher from "../common/LanguageSwitcher";
import ThemeSwitcher from "../common/ThemeSwitcher";

export function SiteHeader({
	title = "Dashboard",
	description = "Overview of your finances",
}) {
	return (
		<header className="sticky top-0 z-30 flex h-14 shrink-0 items-center border-b bg-background/95 backdrop-blur">
			<div className="flex w-full items-center gap-3 px-4 md:px-6">
				<SidebarTrigger />

				<div className="min-w-0 flex-1">
					<h2 className="truncate text-lg font-semibold tracking-tight sm:text-2xl">
						{title}
					</h2>

					<p className="hidden truncate text-sm text-muted-foreground sm:block">
						{description}
					</p>
				</div>
				<div className="ml-auto flex shrink-0 items-center gap-2">
					<LanguageSwitcher />
					<ThemeSwitcher />
				</div>
			</div>
		</header>
	);
}
