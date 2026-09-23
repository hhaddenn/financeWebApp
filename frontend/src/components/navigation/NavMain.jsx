import { useNavigate } from 'react-router-dom';

import {
	SidebarGroup,
	SidebarGroupContent,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from '@/components/ui/sidebar';

export function NavMain({ items }) {
	const navigate = useNavigate();

	return (
		<SidebarGroup>
			<SidebarGroupContent className="flex flex-col gap-2">
				<SidebarMenu>
					{items.map((item) => (
						<SidebarMenuItem key={item.title}>
							<SidebarMenuButton
								tooltip={item.title}
								onClick={() => navigate(item.url)}>
								{item.icon}

								<span>{item.title}</span>

								{item.badge > 0 && (
									<span className="ml-auto flex size-5 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
										{item.badge}
									</span>
								)}
							</SidebarMenuButton>
						</SidebarMenuItem>
					))}
				</SidebarMenu>
			</SidebarGroupContent>
		</SidebarGroup>
	);
}
