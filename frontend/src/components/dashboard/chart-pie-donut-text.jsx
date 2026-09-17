'use client';

import * as React from 'react';
import { TrendingUp } from 'lucide-react';
import { Label, Pie, PieChart } from 'recharts';

import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';
import {
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from '@/components/ui/chart';

export const description = 'A donut chart with text';

const chartData = [
	{ category: 'food', expenses: 275, fill: 'var(--color-food)' },
	{ category: 'car', expenses: 200, fill: 'var(--color-car)' },
	{ category: 'house', expenses: 287, fill: 'var(--color-house)' },
	{ category: 'travel', expenses: 173, fill: 'var(--color-travel)' },
	{ category: 'other', expenses: 190, fill: 'var(--color-other)' },
];

const chartConfig = {
	expenses: {
		label: 'Expenses',
	},
	food: {
		label: 'Food',
		color: 'var(--chart-1)',
	},
	car: {
		label: 'Car',
		color: 'var(--chart-2)',
	},
	house: {
		label: 'House',
		color: 'var(--chart-3)',
	},
	travel: {
		label: 'Travel',
		color: 'var(--chart-4)',
	},
	other: {
		label: 'Other',
		color: 'var(--chart-5)',
	},
};

export function ChartPieDonutText() {
	const totalExpenses = React.useMemo(() => {
		return chartData.reduce((acc, curr) => acc + curr.expenses, 0);
	}, []);

	return (
		<Card className="flex flex-col">
			<CardHeader className="items-center pb-0">
				<CardTitle>Category expenses</CardTitle>
				<CardDescription>September 2026</CardDescription>
			</CardHeader>
			<CardContent className="flex-1 pb-0">
				<ChartContainer
					config={chartConfig}
					className="mx-auto aspect-square max-h-62.5">
					<PieChart>
						<ChartTooltip
							cursor={false}
							content={<ChartTooltipContent hideLabel />}
						/>
						<Pie
							data={chartData}
							dataKey="expenses"
							nameKey="category"
							innerRadius={60}
							strokeWidth={5}>
							<Label
								content={({ viewBox }) => {
									if (viewBox && 'cx' in viewBox && 'cy' in viewBox) {
										return (
											<text
												x={viewBox.cx}
												y={viewBox.cy}
												textAnchor="middle"
												dominantBaseline="middle">
												<tspan
													x={viewBox.cx}
													y={viewBox.cy}
													className="fill-foreground text-3xl font-bold">
													€{totalExpenses.toLocaleString()}
												</tspan>
												<tspan
													x={viewBox.cx}
													y={(viewBox.cy || 0) + 24}
													className="fill-muted-foreground">
													Expenses
												</tspan>
											</text>
										);
									}
								}}
							/>
						</Pie>
					</PieChart>
				</ChartContainer>
			</CardContent>
			<CardFooter className="flex flex-col gap-3">
				<div className="grid w-full grid-cols-2 gap-3">
					{chartData.map((item) => {
						const percentage = ((item.expenses / totalExpenses) * 100).toFixed(
							0,
						);

						return (
							<div
								key={item.category}
								className="flex items-center justify-between gap-2">
								<div className="flex items-center gap-2">
									<div
										className="h-3 w-3 rounded-sm"
										style={{
											backgroundColor: chartConfig[item.category].color,
										}}
									/>
									<span className="text-sm capitalize">
										{chartConfig[item.category].label}
									</span>
								</div>

								<div className="text-sm text-muted-foreground">
									€{item.expenses} ({percentage}%)
								</div>
							</div>
						);
					})}
				</div>

				<div className="text-xs text-muted-foreground">
					Showing total spending this month by category
				</div>
			</CardFooter>
		</Card>
	);
}
