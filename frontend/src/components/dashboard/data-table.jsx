import * as React from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';

import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';

import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table';

import { EllipsisVerticalIcon } from 'lucide-react';

const dummyData = [
	{
		id: 1,
		name: 'Salary',
		counterparty: 'Company XYZ',
		description: 'Monthly salary',
		transaction_type: 'income',
		amount: '2450.00',
		amount_to_receive: '2450.00',
		date: '2026-09-01',
		account: {
			id: 1,
			name: 'Main Account',
		},
		transfer_account: null,
		subcategory: {
			id: 1,
			name: 'Salary',
			category: {
				id: 1,
				name: 'Income',
			},
		},
	},
	{
		id: 2,
		name: 'Rent',
		counterparty: 'Landlord',
		description: 'Monthly rent',
		transaction_type: 'expense',
		amount: '850.00',
		amount_to_receive: '0',
		date: '2026-09-02',
		account: {
			id: 1,
			name: 'Main Account',
		},
		transfer_account: null,
		subcategory: {
			id: 2,
			name: 'Rent',
			category: {
				id: 2,
				name: 'Housing',
			},
		},
	},
	{
		id: 3,
		name: 'Supermarket',
		counterparty: 'Continente',
		description: 'Weekly groceries',
		transaction_type: 'expense',
		amount: '74.32',
		amount_to_receive: '0',
		date: '2026-09-04',
		account: {
			id: 1,
			name: 'Main Account',
		},
		transfer_account: null,
		subcategory: {
			id: 3,
			name: 'Groceries',
			category: {
				id: 3,
				name: 'Food',
			},
		},
	},
	{
		id: 4,
		name: 'Transfer to Savings',
		counterparty: '',
		description: 'Monthly savings',
		transaction_type: 'transfer',
		amount: '300.00',
		amount_to_receive: '0',
		date: '2026-09-05',
		account: {
			id: 1,
			name: 'Main Account',
		},
		transfer_account: {
			id: 2,
			name: 'Savings Account',
		},
		subcategory: null,
	},
	{
		id: 5,
		name: 'Netflix',
		counterparty: 'Netflix',
		description: 'Monthly subscription',
		transaction_type: 'expense',
		amount: '13.99',
		amount_to_receive: '0',
		date: '2026-09-06',
		account: {
			id: 1,
			name: 'Main Account',
		},
		transfer_account: null,
		subcategory: {
			id: 4,
			name: 'Subscriptions',
			category: {
				id: 4,
				name: 'Entertainment',
			},
		},
	},
	{
		id: 6,
		name: 'Restaurant',
		counterparty: 'Pizzaria Central',
		description: 'Dinner',
		transaction_type: 'expense',
		amount: '32.50',
		amount_to_receive: '0',
		date: '2026-09-07',
		account: {
			id: 1,
			name: 'Main Account',
		},
		transfer_account: null,
		subcategory: {
			id: 5,
			name: 'Restaurants',
			category: {
				id: 3,
				name: 'Food',
			},
		},
	},
	{
		id: 7,
		name: 'Freelance',
		counterparty: 'Client ABC',
		description: 'Freelance project',
		transaction_type: 'income',
		amount: '650.00',
		amount_to_receive: '650.00',
		date: '2026-09-08',
		account: {
			id: 1,
			name: 'Main Account',
		},
		transfer_account: null,
		subcategory: {
			id: 6,
			name: 'Freelance',
			category: {
				id: 1,
				name: 'Income',
			},
		},
	},
	{
		id: 8,
		name: 'Electricity',
		counterparty: 'EDP',
		description: 'Electricity bill',
		transaction_type: 'expense',
		amount: '48.76',
		amount_to_receive: '0',
		date: '2026-09-10',
		account: {
			id: 1,
			name: 'Main Account',
		},
		transfer_account: null,
		subcategory: {
			id: 7,
			name: 'Electricity',
			category: {
				id: 2,
				name: 'Housing',
			},
		},
	},
	{
		id: 9,
		name: 'Coffee',
		counterparty: 'Local Café',
		description: 'Morning coffee',
		transaction_type: 'expense',
		amount: '3.20',
		amount_to_receive: '0',
		date: '2026-09-11',
		account: {
			id: 1,
			name: 'Main Account',
		},
		transfer_account: null,
		subcategory: {
			id: 8,
			name: 'Coffee',
			category: {
				id: 3,
				name: 'Food',
			},
		},
	},
	{
		id: 10,
		name: 'Internet',
		counterparty: 'MEO',
		description: 'Internet bill',
		transaction_type: 'expense',
		amount: '39.99',
		amount_to_receive: '0',
		date: '2026-09-12',
		account: {
			id: 1,
			name: 'Main Account',
		},
		transfer_account: null,
		subcategory: {
			id: 9,
			name: 'Internet',
			category: {
				id: 2,
				name: 'Housing',
			},
		},
	},
];

export function DataTable() {
	const [data, setData] = React.useState(dummyData);
	const [selectedRows, setSelectedRows] = React.useState({});
	const [period, setPeriod] = React.useState('day');

	const toggleRow = (id) => {
		setSelectedRows((current) => ({
			...current,
			[id]: !current[id],
		}));
	};

	const toggleAll = () => {
		const allSelected = data.every((item) => selectedRows[item.id]);

		if (allSelected) {
			setSelectedRows({});
			return;
		}

		const next = {};

		data.forEach((item) => {
			next[item.id] = true;
		});

		setSelectedRows(next);
	};

	const allSelected =
		data.length > 0 && data.every((item) => selectedRows[item.id]);

	const selectedCount = Object.values(selectedRows).filter(Boolean).length;

	const formatDate = (dateString) => {
		return new Date(`${dateString}T00:00:00`).toLocaleDateString('pt-PT', {
			day: '2-digit',
			month: 'short',
			year: 'numeric',
		});
	};

	const formatAmount = (transaction) => {
		const amount = Number(transaction.amount);

		const prefix = {
			income: '+',
			expense: '-',
			transfer: '',
		}[transaction.transaction_type];

		return (
			<span
				className={`font-medium ${
					transaction.transaction_type === 'income'
						? 'text-green-600 dark:text-green-400'
						: transaction.transaction_type === 'expense'
							? 'text-red-600 dark:text-red-400'
							: 'text-foreground'
				}`}>
				{prefix}
				{amount.toLocaleString('pt-PT', {
					style: 'currency',
					currency: 'EUR',
				})}
			</span>
		);
	};

	return (
		<div className="w-full space-y-4">
			{/* Header */}
			<div className="flex items-center justify-between px-4 lg:px-6">
				<div>
					<h2 className="text-lg font-semibold">Transactions</h2>
					<p className="text-sm text-muted-foreground">
						View your transactions by day or week.
					</p>
				</div>

				<Select
					value={period}
					onValueChange={setPeriod}
					items={[
						{ label: 'Day', value: 'day' },
						{ label: 'Week', value: 'week' },
					]}>
					<SelectTrigger className="w-24">
						<SelectValue />
					</SelectTrigger>

					<SelectContent>
						<SelectGroup>
							<SelectItem value="day">Day</SelectItem>
							<SelectItem value="week">Week</SelectItem>
						</SelectGroup>
					</SelectContent>
				</Select>
			</div>

			{/* Table */}
			<div className="overflow-hidden rounded-lg border">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead className="w-12">
								<div className="flex items-center justify-center">
									<Checkbox
										checked={allSelected}
										onCheckedChange={toggleAll}
										aria-label="Select all"
									/>
								</div>
							</TableHead>

							<TableHead>Date</TableHead>
							<TableHead>Transaction</TableHead>
							<TableHead>Category</TableHead>
							<TableHead>Account</TableHead>
							<TableHead>Type</TableHead>
							<TableHead className="text-right">Amount</TableHead>
							<TableHead className="w-12" />
						</TableRow>
					</TableHeader>

					<TableBody>
						{data.map((transaction) => {
							const subcategory = transaction.subcategory;

							return (
								<TableRow
									key={transaction.id}
									data-state={
										selectedRows[transaction.id] ? 'selected' : undefined
									}>
									{/* Selection */}
									<TableCell>
										<div className="flex items-center justify-center">
											<Checkbox
												checked={!!selectedRows[transaction.id]}
												onCheckedChange={() => toggleRow(transaction.id)}
												aria-label={`Select ${transaction.name}`}
											/>
										</div>
									</TableCell>

									{/* Date */}
									<TableCell className="whitespace-nowrap">
										{formatDate(transaction.date)}
									</TableCell>

									{/* Transaction */}
									<TableCell>
										<div className="flex flex-col">
											<span className="font-medium">
												{transaction.name || 'Unnamed transaction'}
											</span>

											{transaction.counterparty && (
												<span className="text-xs text-muted-foreground">
													{transaction.counterparty}
												</span>
											)}
										</div>
									</TableCell>

									{/* Category */}
									<TableCell>
										{subcategory ? (
											<div className="flex flex-col">
												<span>{subcategory.category.name}</span>

												<span className="text-xs text-muted-foreground">
													{subcategory.name}
												</span>
											</div>
										) : (
											<span className="text-muted-foreground">—</span>
										)}
									</TableCell>

									{/* Account */}
									<TableCell>
										{transaction.transaction_type === 'transfer' ? (
											<div className="flex flex-col">
												<span>{transaction.account.name}</span>

												<span className="text-xs text-muted-foreground">
													→ {transaction.transfer_account?.name}
												</span>
											</div>
										) : (
											transaction.account?.name || '—'
										)}
									</TableCell>

									{/* Type */}
									<TableCell>
										<Badge variant="outline">
											{transaction.transaction_type === 'income'
												? 'Income'
												: transaction.transaction_type === 'expense'
													? 'Expense'
													: 'Transfer'}
										</Badge>
									</TableCell>

									{/* Amount */}
									<TableCell className="text-right">
										{formatAmount(transaction)}
									</TableCell>

									{/* Actions */}
									<TableCell>
										<DropdownMenu>
											<DropdownMenuTrigger
												render={
													<Button
														variant="ghost"
														className="size-8 text-muted-foreground"
														size="icon"
													/>
												}>
												<EllipsisVerticalIcon />
												<span className="sr-only">Open menu</span>
											</DropdownMenuTrigger>

											<DropdownMenuContent align="end" className="w-32">
												<DropdownMenuItem>Edit</DropdownMenuItem>

												<DropdownMenuItem>Duplicate</DropdownMenuItem>

												<DropdownMenuSeparator />

												<DropdownMenuItem variant="destructive">
													Delete
												</DropdownMenuItem>
											</DropdownMenuContent>
										</DropdownMenu>
									</TableCell>
								</TableRow>
							);
						})}
					</TableBody>
				</Table>
			</div>

			{/* Footer */}
			<div className="flex items-center justify-between px-4">
				<div className="text-sm text-muted-foreground">
					{selectedCount} of {data.length} transaction(s) selected.
				</div>

				<div className="text-sm font-medium">
					Showing: <span className="capitalize">{period}</span>
				</div>
			</div>
		</div>
	);
}
