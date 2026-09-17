'use client';

import { TrendingUp } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';

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

export const description = 'A multiple bar chart';

const chartData = [
	{ month: 'January', expense: 186, income: 80 },
	{ month: 'February', expense: 305, income: 200 },
	{ month: 'March', expense: 237, income: 120 },
	{ month: 'April', expense: 73, income: 190 },
	{ month: 'May', expense: 209, income: 130 },
	{ month: 'June', expense: 214, income: 140 },
	{ month: 'July', expense: 214, income: 140 },
	{ month: 'August', expense: 214, income: 140 },
	{ month: 'September', expense: 214, income: 140 },
	{ month: 'October', expense: 214, income: 140 },
	{ month: 'November', expense: 214, income: 140 },
	{ month: 'December', expense: 214, income: 140 },
];

const chartConfig = {
	expense: {
		label: 'Expense',
		color: 'var(--chart-1)',
	},
	income: {
		label: 'Income',
		color: 'var(--chart-2)',
	},
};

export function ChartBarMultiple() {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Balance</CardTitle>
				<CardDescription>January - December 2026</CardDescription>
			</CardHeader>
			<CardContent>
				<ChartContainer config={chartConfig}>
					<BarChart accessibilityLayer data={chartData}>
						<CartesianGrid vertical={false} />
						<YAxis
							tickLine={false}
							axisLine={false}
							tickMargin={10}
							tickFormatter={(value) => `€${value}`}
						/>

						<XAxis
							dataKey="month"
							tickLine={false}
							tickMargin={10}
							axisLine={false}
							tickFormatter={(value) => value.slice(0, 3)}
						/>
						<ChartTooltip
							cursor={false}
							content={<ChartTooltipContent indicator="dashed" />}
						/>
						<Bar dataKey="expense" fill="var(--color-expense)" radius={4} />
						<Bar dataKey="income" fill="var(--color-income)" radius={4} />
					</BarChart>
				</ChartContainer>
			</CardContent>
			<CardFooter className="flex-col items-start gap-2 text-sm">
				<div className="flex gap-2 leading-none font-medium">
					Expenses were higher this month
				</div>
				<div className="leading-none text-muted-foreground">
					Showing balance for this year
				</div>
			</CardFooter>
		</Card>
	);
}
