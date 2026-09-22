import * as React from 'react';

import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';

import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table';

import { usePreferences } from '@/context/PreferencesContext';

export function TransactionsTable({
	transactions = [],
	loading = false,
	onEdit,
	onDelete,
}) {
	const { language, t, translateCategory, translateSubcategory } =
		usePreferences();

	const locale = language === 'pt' ? 'pt-PT' : 'en-US';

	const formatDate = (date) => {
		if (!date) {
			return '—';
		}

		return new Intl.DateTimeFormat(locale, {
			dateStyle: 'medium',
		}).format(new Date(`${date}T00:00:00`));
	};

	const formatAmount = (transaction) => {
		const amount = Number(transaction.amount ?? 0);

		const formatted = new Intl.NumberFormat(locale, {
			style: 'currency',
			currency: 'EUR',
		}).format(Math.abs(amount));

		if (transaction.transaction_type === 'income') {
			return `+${formatted}`;
		}

		if (transaction.transaction_type === 'expense') {
			return `-${formatted}`;
		}

		return formatted;
	};

	const getTransactionTypeLabel = (type) => {
		switch (type) {
			case 'income':
				return t('transactions.income');

			case 'expense':
				return t('transactions.expense');

			case 'transfer':
				return t('transactions.transfer');

			default:
				return type || '—';
		}
	};

	return (
		<div className="overflow-hidden rounded-lg border">
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>{t('transactions.date')}</TableHead>

						<TableHead>{t('transactions.transaction')}</TableHead>

						<TableHead>{t('transactions.category')}</TableHead>

						<TableHead>{t('transactions.account')}</TableHead>

						<TableHead>{t('transactions.type')}</TableHead>

						<TableHead className="text-right">
							{t('transactions.amount')}
						</TableHead>

						<TableHead className="w-12">
							<span className="sr-only">{t('transactions.openMenu')}</span>
						</TableHead>
					</TableRow>
				</TableHeader>

				<TableBody>
					{loading ? (
						<TableRow>
							<TableCell colSpan={7} className="h-24 text-center">
								<span className="text-muted-foreground">
									{t('transactions.loading')}
								</span>
							</TableCell>
						</TableRow>
					) : transactions.length === 0 ? (
						<TableRow>
							<TableCell colSpan={7} className="h-24 text-center">
								<span className="text-muted-foreground">
									{t('transactions.empty')}
								</span>
							</TableCell>
						</TableRow>
					) : (
						transactions.map((transaction) => {
							const subcategory = transaction.subcategory;

							return (
								<TableRow key={transaction.id}>
									<TableCell className="whitespace-nowrap">
										{formatDate(transaction.date)}
									</TableCell>

									<TableCell>
										<div className="flex min-w-0 flex-col">
											<span className="truncate font-medium">
												{transaction.name || t('transactions.unnamed')}
											</span>

											{transaction.counterparty && (
												<span className="text-muted-foreground truncate text-xs">
													{transaction.counterparty}
												</span>
											)}
										</div>
									</TableCell>

									<TableCell>
										{subcategory ? (
											<div className="flex flex-col">
												<span>
													{translateCategory(subcategory.category?.name)}
												</span>

												<span className="text-muted-foreground text-xs">
													{translateSubcategory(subcategory.name)}
												</span>
											</div>
										) : (
											'—'
										)}
									</TableCell>

									<TableCell>
										{transaction.transaction_type === 'transfer' ? (
											<div className="flex flex-col">
												<span>{transaction.account?.name}</span>

												{transaction.transfer_account && (
													<span className="text-muted-foreground text-xs">
														→ {transaction.transfer_account.name}
													</span>
												)}
											</div>
										) : (
											transaction.account?.name || '—'
										)}
									</TableCell>

									<TableCell>
										{getTransactionTypeLabel(transaction.transaction_type)}
									</TableCell>

									<TableCell className="text-right font-medium">
										<span
											className={
												transaction.transaction_type === 'income'
													? 'text-emerald-600 dark:text-emerald-400'
													: transaction.transaction_type === 'expense'
														? 'text-red-600 dark:text-red-400'
														: ''
											}>
											{formatAmount(transaction)}
										</span>
									</TableCell>

									<TableCell>
										<DropdownMenu>
											<DropdownMenuTrigger asChild>
												<Button
													type="button"
													variant="ghost"
													size="icon"
													aria-label={t('transactions.openMenu')}>
													<MoreHorizontal className="h-4 w-4" />
												</Button>
											</DropdownMenuTrigger>

											<DropdownMenuContent align="end">
												<DropdownMenuItem onClick={() => onEdit?.(transaction)}>
													<Pencil className="mr-2 h-4 w-4" />

													{transaction.transaction_type === 'income'
														? t('transactions.editIncome')
														: transaction.transaction_type === 'expense'
															? t('transactions.editExpense')
															: t('transactions.editTransfer')}
												</DropdownMenuItem>

												<DropdownMenuItem
													variant="destructive"
													onClick={() => onDelete?.(transaction)}>
													<Trash2 className="mr-2 h-4 w-4" />

													{t('transactions.deleteTitle').replace('?', '')}
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
	);
}
