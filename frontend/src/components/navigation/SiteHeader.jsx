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
					<h2 className="text-2xl font-semibold tracking-tight">{title}</h2>

					<p className="text-sm text-muted-foreground">{description}</p>
				</div>
			</div>
		</header>
	);
}
