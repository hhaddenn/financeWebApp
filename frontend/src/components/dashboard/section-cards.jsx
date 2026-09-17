'use client';

import { TrendingDownIcon, TrendingUpIcon } from 'lucide-react';

import { Card, CardContent, CardHeader } from '@/components/ui/card';

const cards = [
	{
		title: 'Main account',
		value: '€12,450.00',
		change: '+12.5%',
		positive: true,
	},
	{
		title: 'Trade Republic',
		value: '€8,240.00',
		change: '+8.2%',
		positive: true,
	},
	{
		title: 'Waller',
		value: '€20.00',
		change: '-4.1%',
		positive: false,
	},
	{
		title: 'Savings',
		value: '€5,120.00',
		change: '+18.3%',
		positive: true,
	},
];

export function SectionCards() {
	return (
		<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
			{cards.map((card) => {
				const Icon = card.positive ? TrendingUpIcon : TrendingDownIcon;

				return (
					<Card key={card.title} className="shadow-none">
						<CardHeader className="pb-2">
							<p className="text-sm text-muted-foreground">{card.title}</p>
						</CardHeader>

						<CardContent>
							<div className="flex items-end justify-between gap-4">
								<p className="text-2xl font-semibold tracking-tight tabular-nums">
									{card.value}
								</p>

								<div
									className={
										card.positive
											? 'flex items-center gap-1 text-xs font-medium text-emerald-600'
											: 'flex items-center gap-1 text-xs font-medium text-red-600'
									}>
									<Icon className="size-3.5" />
									{card.change}
								</div>
							</div>

							<p className="mt-1 text-xs text-muted-foreground">
								vs. previous month
							</p>
						</CardContent>
					</Card>
				);
			})}
		</div>
	);
}
