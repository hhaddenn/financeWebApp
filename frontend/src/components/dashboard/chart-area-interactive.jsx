'use client';

import { useEffect, useState } from 'react';
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

import { getTransactions } from '@/api/transactions';

const months = [
	'January',
	'February',
	'March',
	'April',
	'May',
	'June',
	'July',
	'August',
	'September',
	'October',
	'November',
	'December',
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
	const [chartData, setChartData] = useState(
		months.map((month) => ({
			month,
			expense: 0,
			income: 0,
		})),
	);

	const currentYear = new Date().getFullYear();

	useEffect(() => {
		const fetchTransactions = async () => {
			try {
				const transactions = await getTransactions();

				const monthlyData = months.map((month) => ({
					month,
					expense: 0,
					income: 0,
				}));

				transactions.forEach((transaction) => {
					const date = new Date(transaction.date);

					// Só processar transações deste ano
					if (date.getFullYear() !== currentYear) {
						return;
					}

					const monthIndex = date.getMonth();
					const amount = Number(transaction.amount);

					if (transaction.transaction_type === 'expense') {
						monthlyData[monthIndex].expense += amount;
					}

					if (transaction.transaction_type === 'income') {
						monthlyData[monthIndex].income += amount;
					}
				});

				setChartData(monthlyData);
			} catch (error) {
				console.error('Failed to fetch transactions:', error);
			}
		};

		fetchTransactions();
	}, [currentYear]);

	return (
		<Card>
			<CardHeader>
				<CardTitle>Balance</CardTitle>

				<CardDescription>January - December {currentYear}</CardDescription>
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
					Income and expenses for {currentYear}
					<TrendingUp className="h-4 w-4" />
				</div>

				<div className="leading-none text-muted-foreground">
					Showing monthly transaction totals
				</div>
			</CardFooter>
		</Card>
	);
}
