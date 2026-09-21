'use client';

import * as React from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from '@/components/ui/alert-dialog';

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

import { getTransactions, deleteTransaction } from '@/api/transactions';

import { iconMap } from '@/lib/icons';
import { TransactionDialog } from './transaction-dialog';

export function DataTable() {
	const [data, setData] = React.useState([]);
	const [selectedRows, setSelectedRows] = React.useState({});
	const [period, setPeriod] = React.useState('today');
	const [loading, setLoading] = React.useState(true);
	const [error, setError] = React.useState(null);

	const [editingTransaction, setEditingTransaction] = React.useState(null);

	const [deleting, setDeleting] = React.useState(false);

	// Transaction selected for deletion
	const [transactionToDelete, setTransactionToDelete] = React.useState(null);

	React.useEffect(() => {
		const loadTransactions = async () => {
			try {
				setLoading(true);
				setError(null);

				const filters = getDateFilters(period);

				const transactions = await getTransactions(filters);

				setData(transactions);
			} catch (err) {
				console.error('Failed to load transactions:', err);
				setError('Failed to load transactions.');
			} finally {
				setLoading(false);
			}
		};

		loadTransactions();
	}, [period]);

	const handleEdit = (transaction) => {
		setEditingTransaction(transaction);
	};

	// Open custom confirmation dialog
	const handleDeleteRequest = (transaction) => {
		setTransactionToDelete(transaction);
	};

	// Actually delete the transaction
	const handleDeleteConfirm = async () => {
		if (!transactionToDelete) {
			return;
		}

		try {
			setDeleting(true);
			setError(null);

			await deleteTransaction(transactionToDelete.id);

			// Reload the whole page so account balances,
			// dashboard cards and transactions are all updated.
			window.location.reload();
		} catch (err) {
			console.error('Failed to delete transaction:', err);

			setError('Failed to delete transaction.');
			setDeleting(false);
		}
	};

	const toggleRow = (id) => {
		setSelectedRows((current) => ({
			...current,
			[id]: !current[id],
		}));
	};

	const toggleAll = () => {
		const allSelected =
			data.length > 0 && data.every((item) => selectedRows[item.id]);

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
		if (!dateString) {
			return '—';
		}

		const date = new Date(dateString);

		if (isNaN(date.getTime())) {
			return 'Invalid Date';
		}

		return date.toLocaleDateString('pt-PT', {
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

	const getCategoryIcon = (transaction) => {
		const iconName = transaction.subcategory?.icon;

		if (!iconName) {
			return iconMap['circle-help'];
		}

		return iconMap[iconName] || iconMap['circle-help'];
	};

	const getDateFilters = (period) => {
		const now = new Date();

		const formatDate = (date) => {
			const year = date.getFullYear();
			const month = String(date.getMonth() + 1).padStart(2, '0');
			const day = String(date.getDate()).padStart(2, '0');

			return `${year}-${month}-${day}`;
		};

		if (period === 'today') {
			const today = formatDate(now);

			return {
				start_date: today,
				end_date: today,
			};
		}

		if (period === 'week') {
			const day = now.getDay();
			// JS: Sunday = 0, Monday = 1, ..., Saturday = 6

			const monday = new Date(now);
			const diff = day === 0 ? -6 : 1 - day;
			monday.setDate(now.getDate() + diff);

			const sunday = new Date(monday);
			sunday.setDate(monday.getDate() + 6);

			return {
				start_date: formatDate(monday),
				end_date: formatDate(sunday),
			};
		}

		return {};
	};

	return (
		<>
			<div className="w-full space-y-4">
				{/* Header */}
				<div className="flex items-center justify-between px-4 lg:px-6">
					<div>
						<h2 className="text-lg font-semibold">Transactions</h2>

						<p className="text-sm text-muted-foreground">
							View your transactions from today or this week.
						</p>
					</div>

					<Select value={period} onValueChange={setPeriod}>
						<SelectTrigger className="w-24">
							<SelectValue />
						</SelectTrigger>

						<SelectContent>
							<SelectGroup>
								<SelectItem value="today">Today</SelectItem>

								<SelectItem value="week">This Week</SelectItem>
							</SelectGroup>
						</SelectContent>
					</Select>
				</div>

				{/* Loading */}
				{loading && (
					<div className="rounded-lg border p-8 text-center text-sm text-muted-foreground">
						Loading transactions...
					</div>
				)}

				{/* Error */}
				{!loading && error && (
					<div className="rounded-lg border border-destructive/50 p-8 text-center text-sm text-destructive">
						{error}
					</div>
				)}

				{/* Table */}
				{!loading && !error && (
					<div className="overflow-hidden rounded-lg border">
						<Table>
							<TableHeader>
								<TableRow>
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
								{data.length === 0 ? (
									<TableRow>
										<TableCell
											colSpan={7}
											className="h-24 text-center text-muted-foreground">
											No transactions found.
										</TableCell>
									</TableRow>
								) : (
									data.map((transaction) => {
										const subcategory = transaction.subcategory;

										const CategoryIcon = getCategoryIcon(transaction);

										return (
											<TableRow
												key={transaction.id}
												data-state={
													selectedRows[transaction.id] ? 'selected' : undefined
												}>
												{/* Date */}
												<TableCell className="whitespace-nowrap">
													{formatDate(transaction.date)}
												</TableCell>

												{/* Transaction */}
												<TableCell>
													<div className="flex flex-col">
														<div className="flex items-center gap-2">
															<span className="font-medium">
																{transaction.name || 'Unnamed transaction'}
															</span>

															{transaction.checked ? (
																transaction.applied ? (
																	<Badge variant="default">Paid</Badge>
																) : (
																	<Badge variant="secondary">Scheduled</Badge>
																)
															) : (
																<Badge variant="secondary">Not paid</Badge>
															)}
														</div>

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
														<div className="flex items-center gap-3">
															<div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted">
																<CategoryIcon className="size-4 text-muted-foreground" />
															</div>

															<div className="flex flex-col">
																<span>{subcategory.category.name}</span>

																<span className="text-xs text-muted-foreground">
																	{subcategory.name}
																</span>
															</div>
														</div>
													) : (
														<div className="flex items-center gap-3">
															<div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted">
																<CategoryIcon className="size-4 text-muted-foreground" />
															</div>

															<span className="text-muted-foreground">—</span>
														</div>
													)}
												</TableCell>

												{/* Account */}
												<TableCell>
													{transaction.transaction_type === 'transfer' ? (
														<div className="flex flex-col">
															<span>{transaction.account?.name}</span>

															{transaction.transfer_account && (
																<span className="text-xs text-muted-foreground">
																	→ {transaction.transfer_account.name}
																</span>
															)}
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
																	size="icon">
																	<EllipsisVerticalIcon />

																	<span className="sr-only">Open menu</span>
																</Button>
															}
														/>

														<DropdownMenuContent align="end" className="w-32">
															<DropdownMenuItem
																onClick={() => handleEdit(transaction)}>
																Edit
															</DropdownMenuItem>

															<DropdownMenuSeparator />

															<DropdownMenuItem
																variant="destructive"
																disabled={deleting}
																onClick={() =>
																	handleDeleteRequest(transaction)
																}>
																Delete
															</DropdownMenuItem>
														</DropdownMenuContent>
													</DropdownMenu>
												</TableCell>
											</TableRow>
										);
									})
								)}
							</TableBody>
						</Table>
					</div>
				)}
			</div>

			{/* Edit dialog */}
			<TransactionDialog
				type={editingTransaction?.transaction_type ?? null}
				transaction={editingTransaction}
				open={editingTransaction !== null}
				onOpenChange={(isOpen) => {
					if (!isOpen) {
						setEditingTransaction(null);
					}
				}}
				onCreated={() => {
					window.location.reload();
				}}
			/>

			{/* Delete confirmation dialog */}
			<AlertDialog
				open={transactionToDelete !== null}
				onOpenChange={(open) => {
					if (!open && !deleting) {
						setTransactionToDelete(null);
					}
				}}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Delete transaction?</AlertDialogTitle>

						<AlertDialogDescription>
							Are you sure you want to delete{' '}
							<span className="font-medium text-foreground">
								"{transactionToDelete?.name || 'this transaction'}"
							</span>
							? This action cannot be undone and the account balance will be
							updated.
						</AlertDialogDescription>
					</AlertDialogHeader>

					<AlertDialogFooter>
						<AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>

						<AlertDialogAction
							variant="destructive"
							disabled={deleting}
							onClick={handleDeleteConfirm}>
							{deleting ? 'Deleting...' : 'Delete'}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
}
