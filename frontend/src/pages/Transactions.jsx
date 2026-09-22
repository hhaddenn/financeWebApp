import * as React from 'react';

import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/navigation/AppSidebar';
import { SiteHeader } from '@/components/navigation/SiteHeader';
import { TransactionsFilters } from '@/components/transactions/TransactionsFilters';
import { TransactionsTable } from '@/components/transactions/TransactionsTable';
import { TransactionDialog } from '@/components/transactions/TransactionDialog';
import { TransactionActionMenu } from '@/components/transactions/TransactionActionMenu';

import { getAccounts } from '@/api/accounts';
import { getCategories, getSubcategories } from '@/api/categories';
import { getTransactions, deleteTransaction } from '@/api/transactions';

import { usePreferences } from '@/context/PreferencesContext';

export default function Transactions() {
	const { t } = usePreferences();

	const [filters, setFilters] = React.useState({
		search: '',
		type: '',
		account: '',
		category: '',
		subcategory: '',
		checked: '',
		start_date: '',
		end_date: '',
	});

	const [accounts, setAccounts] = React.useState([]);
	const [categories, setCategories] = React.useState([]);
	const [subcategories, setSubcategories] = React.useState([]);
	const [transactions, setTransactions] = React.useState([]);
	const [loading, setLoading] = React.useState(false);

	const [editingTransaction, setEditingTransaction] = React.useState(null);

	const [deletingTransaction, setDeletingTransaction] = React.useState(null);
	const [deleting, setDeleting] = React.useState(false);

	React.useEffect(() => {
		const loadFilterData = async () => {
			try {
				const [
					accountsData,
					incomeCategories,
					expenseCategories,
					subcategoriesData,
				] = await Promise.all([
					getAccounts(),
					getCategories('income'),
					getCategories('expense'),
					getSubcategories(),
				]);

				setAccounts(accountsData);
				setSubcategories(subcategoriesData);

				const categoryMap = new Map();

				[...incomeCategories, ...expenseCategories].forEach((category) => {
					categoryMap.set(category.id, category);
				});

				setCategories(Array.from(categoryMap.values()));
			} catch (error) {
				console.error('Failed to load filter data:', error);
			}
		};

		loadFilterData();
	}, []);

	const loadTransactions = React.useCallback(async () => {
		setLoading(true);

		try {
			const response = await getTransactions(filters);
			setTransactions(response.results ?? response);
		} catch (error) {
			console.error('Failed to load transactions:', error);
		} finally {
			setLoading(false);
		}
	}, [filters]);

	React.useEffect(() => {
		loadTransactions();
	}, [loadTransactions]);

	const handleEdit = (transaction) => {
		setEditingTransaction(transaction);
	};

	const handleDelete = (transaction) => {
		setDeletingTransaction(transaction);
	};

	const confirmDelete = async () => {
		if (!deletingTransaction) {
			return;
		}

		try {
			setDeleting(true);

			await deleteTransaction(deletingTransaction.id);

			setDeletingTransaction(null);
			await loadTransactions();
		} catch (error) {
			console.error('Failed to delete transaction:', error);
		} finally {
			setDeleting(false);
		}
	};

	const handleTransactionSaved = async () => {
		setEditingTransaction(null);
		await loadTransactions();
	};

	return (
		<SidebarProvider>
			<AppSidebar />

			<SidebarInset className="min-h-svh bg-background">
				<SiteHeader
					title={t('navigation.transactions')}
					description={t('transactions.description')}
				/>
				<main className="flex-1 bg-background">
					<div className="mx-auto w-full max-w-[1600px] space-y-6 p-4 md:p-6 lg:p-8">
						<TransactionsFilters
							filters={filters}
							onFiltersChange={setFilters}
							accounts={accounts}
							categories={categories}
							subcategories={subcategories}
						/>
						<TransactionsTable
							transactions={transactions}
							loading={loading}
							onEdit={handleEdit}
							onDelete={handleDelete}
						/>
					</div>
				</main>
				<TransactionActionMenu />
			</SidebarInset>

			{/* Edit transaction */}
			<TransactionDialog
				type={editingTransaction?.transaction_type ?? null}
				transaction={editingTransaction}
				open={editingTransaction !== null}
				onOpenChange={(isOpen) => {
					if (!isOpen) {
						setEditingTransaction(null);
					}
				}}
				onCreated={handleTransactionSaved}
			/>

			{/* Delete confirmation */}
			{deletingTransaction && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
					<div className="w-full max-w-md rounded-lg border bg-background p-6 shadow-lg">
						<div className="space-y-2">
							<h2 className="text-lg font-semibold">
								{t('transactions.deleteTitle')}
							</h2>

							<p className="text-sm text-muted-foreground">
								{t('transactions.deleteDescription')}{' '}
								<strong>
									{deletingTransaction.name ||
										t('transactions.thisTransaction')}
								</strong>
								.
							</p>

							<p className="text-sm text-muted-foreground">
								{t('transactions.deleteWarning')}
							</p>
						</div>

						<div className="mt-6 flex justify-end gap-2">
							<button
								type="button"
								className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted"
								onClick={() => setDeletingTransaction(null)}
								disabled={deleting}>
								{t('common.cancel')}
							</button>

							<button
								type="button"
								className="rounded-md bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground hover:bg-destructive/90"
								onClick={confirmDelete}
								disabled={deleting}>
								{deleting ? t('transactions.deleting') : t('common.delete')}
							</button>
						</div>
					</div>
				</div>
			)}
		</SidebarProvider>
	);
}
