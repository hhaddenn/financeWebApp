import { SidebarTrigger } from '@/components/ui/sidebar';

export function SiteHeader({
	title = 'Dashboard',
	description = 'Overview of your finances',
}) {
	return (
		<header className="sticky top-0 z-30 flex h-14 shrink-0 items-center border-b bg-background/95 backdrop-blur">
			<div className="flex w-full items-center gap-3 px-4 md:px-6">
				<SidebarTrigger />

				<div>
					<h1 className="text-sm font-semibold">{title}</h1>

					<p className="hidden text-xs text-muted-foreground sm:block">
						{description}
					</p>
				</div>
			</div>
		</header>
	);
}
