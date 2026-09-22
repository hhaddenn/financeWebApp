'use client';

import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
	DialogFooter,
} from '@/components/ui/dialog';

import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import { Calendar } from '@/components/ui/calendar';

import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from '@/components/ui/popover';

import { useState, useEffect } from 'react';

import { format } from 'date-fns';
import { enUS, pt } from 'date-fns/locale';

import { createTransaction, updateTransaction } from '@/api/transactions';

import { getCategories, getSubcategories } from '@/api/categories';

import {
	getCategoryPreferences,
	getSubcategoryPreferences,
} from '@/api/settings';

import { getAccounts } from '@/api/accounts';

import { iconMap } from '@/lib/icons';

import { usePreferences } from '@/context/PreferencesContext';

function CategoryIcon({ name, className }) {
	const Icon = name ? iconMap[name] : null;

	if (!Icon) return null;

	return <Icon className={className} />;
}

export function TransactionDialog({
	type,
	transaction = null,
	open,
	onOpenChange,
	onCreated,
}) {
	const { language, t, translateCategory, translateSubcategory } =
		usePreferences();

	const isEditing = Boolean(transaction);

	const dateLocale = language === 'pt' ? pt : enUS;

	const titles = {
		income: isEditing
			? t('transactions.editIncome')
			: t('transactions.addIncome'),

		expense: isEditing
			? t('transactions.editExpense')
			: t('transactions.addExpense'),

		transfer: isEditing
			? t('transactions.editTransfer')
			: t('transactions.makeTransfer'),
	};

	const [saving, setSaving] = useState(false);

	const [categories, setCategories] = useState([]);
	const [subcategories, setSubcategories] = useState([]);

	const [categoryPreferences, setCategoryPreferences] = useState([]);
	const [subcategoryPreferences, setSubcategoryPreferences] = useState([]);

	const [accounts, setAccounts] = useState([]);

	const [accountOpen, setAccountOpen] = useState(false);
	const [transferAccountOpen, setTransferAccountOpen] = useState(false);
	const [categoryOpen, setCategoryOpen] = useState(false);

	const [selectedCategoryId, setSelectedCategoryId] = useState(null);

	const [form, setForm] = useState({
		date: new Date().toISOString().split('T')[0],
		name: '',
		amount: 0,
		amount_to_receive: 0,
		counterparty: '',
		account_id: '',
		transfer_account_id: '',
		subcategory_id: '',
		checked: true,
	});

	/*
	 * Load categories, subcategories and user preferences.
	 */
	useEffect(() => {
		if (!open) return;

		const loadData = async () => {
			try {
				const [
					categoriesData,
					subcategoriesData,
					categoryPreferencesData,
					subcategoryPreferencesData,
				] = await Promise.all([
					getCategories(type),
					getSubcategories(),
					getCategoryPreferences(),
					getSubcategoryPreferences(),
				]);

				setCategories(categoriesData);
				setSubcategories(subcategoriesData);
				setCategoryPreferences(categoryPreferencesData);
				setSubcategoryPreferences(subcategoryPreferencesData);
			} catch (error) {
				console.error('Failed to load transaction data:', error);

				console.error('Backend response:', error.response?.data);
			}
		};

		loadData();
	}, [open, type]);

	/*
	 * Reload accounts every time the dialog opens.
	 */
	useEffect(() => {
		if (!open) return;

		const loadAccounts = async () => {
			try {
				const accountsData = await getAccounts();
				setAccounts(accountsData);
			} catch (error) {
				console.error('Failed to load accounts:', error);
			}
		};

		loadAccounts();
	}, [open]);

	/*
	 * Populate form when editing.
	 */
	useEffect(() => {
		if (!open) return;

		if (transaction) {
			setForm({
				date: transaction.date ? transaction.date.split('T')[0] : '',

				name: transaction.name || '',

				amount:
					transaction.amount !== null && transaction.amount !== undefined
						? Number(transaction.amount)
						: 0,

				amount_to_receive:
					transaction.amount_to_receive !== null &&
					transaction.amount_to_receive !== undefined
						? Number(transaction.amount_to_receive)
						: 0,

				counterparty: transaction.counterparty || '',

				account_id: transaction.account?.id
					? String(transaction.account.id)
					: '',

				transfer_account_id: transaction.transfer_account?.id
					? String(transaction.transfer_account.id)
					: '',

				subcategory_id: transaction.subcategory?.id
					? String(transaction.subcategory.id)
					: '',

				checked: transaction.checked ?? true,
			});

			if (transaction.subcategory?.category?.id) {
				setSelectedCategoryId(String(transaction.subcategory.category.id));
			} else {
				setSelectedCategoryId(null);
			}
		} else {
			setForm({
				date: new Date().toISOString().split('T')[0],
				name: '',
				amount: 0,
				amount_to_receive: 0,
				counterparty: '',
				account_id: '',
				transfer_account_id: '',
				subcategory_id: '',
				checked: true,
			});

			setSelectedCategoryId(null);
		}
	}, [open, transaction]);

	/*
	 * Create lookup maps for user preferences.
	 */
	const categoryPreferencesMap = Object.fromEntries(
		categoryPreferences.map((preference) => [
			preference.category.id,
			preference,
		]),
	);

	const subcategoryPreferencesMap = Object.fromEntries(
		subcategoryPreferences.map((preference) => [
			preference.subcategory.id,
			preference,
		]),
	);

	/*
	 * Only show categories that are not hidden.
	 */
	const visibleCategories = categories.filter((category) => {
		const preference = categoryPreferencesMap[category.id];

		return !preference?.hidden;
	});

	/*
	 * Only show subcategories that are not hidden
	 * and whose category is not hidden.
	 */
	const visibleSubcategories = subcategories.filter((subcategory) => {
		const categoryPreference = categoryPreferencesMap[subcategory.category?.id];

		const subcategoryPreference = subcategoryPreferencesMap[subcategory.id];

		return !categoryPreference?.hidden && !subcategoryPreference?.hidden;
	});

	/*
	 * Internal Transfer is read-only in the UI.
	 */
	const internalTransferSubcategory = subcategories.find(
		(subcategory) => subcategory.name?.toLowerCase() === 'internal transfer',
	);

	/*
	 * For a new transfer, keep Internal Transfer selected
	 * internally for display purposes.
	 */
	useEffect(() => {
		if (type === 'transfer' && !isEditing && internalTransferSubcategory) {
			setForm((current) => ({
				...current,
				subcategory_id: String(internalTransferSubcategory.id),
			}));
		}
	}, [type, isEditing, internalTransferSubcategory]);

	const handleSubmit = async (event) => {
		event.preventDefault();

		try {
			setSaving(true);

			const payload = {
				date: form.date,
				name: form.name,
				amount: Number(form.amount),
				transaction_type: type,
				account_id: Number(form.account_id),
				checked: form.checked,
			};

			if (type === 'transfer') {
				payload.transfer_account_id = Number(form.transfer_account_id);
			}

			if (type === 'income' || type === 'expense') {
				payload.counterparty = form.counterparty || null;

				if (type === 'expense') {
					payload.amount_to_receive = Number(form.amount_to_receive);
				}

				if (form.subcategory_id) {
					payload.subcategory_id = Number(form.subcategory_id);
				}
			}

			console.log('Transaction payload:', payload);

			if (isEditing) {
				await updateTransaction(transaction.id, payload);
			} else {
				await createTransaction(payload);
			}

			onOpenChange(false);

			if (onCreated) {
				onCreated();
			}
		} catch (error) {
			console.error('Failed to save transaction:', error);

			console.error('Backend response:', error.response?.data);
		} finally {
			setSaving(false);
		}
	};

	const selectedDate = form.date
		? new Date(`${form.date}T00:00:00`)
		: undefined;

	const selectedAccount = accounts.find(
		(account) => String(account.id) === String(form.account_id),
	);

	const selectedTransferAccount = accounts.find(
		(account) => String(account.id) === String(form.transfer_account_id),
	);

	const selectedCategory = categories.find(
		(category) => String(category.id) === String(selectedCategoryId),
	);

	const selectedSubcategory = subcategories.find(
		(subcategory) => String(subcategory.id) === String(form.subcategory_id),
	);

	const filteredSubcategories = visibleSubcategories.filter(
		(subcategory) =>
			String(subcategory.category?.id) === String(selectedCategoryId),
	);

	const availableTransferAccounts = accounts.filter(
		(account) => String(account.id) !== String(form.account_id),
	);

	const handleCategorySelect = (category) => {
		setSelectedCategoryId(String(category.id));
	};

	const handleSubcategorySelect = (subcategory) => {
		setForm((current) => ({
			...current,
			subcategory_id: String(subcategory.id),
		}));

		setCategoryOpen(false);
	};

	const resetCategoryMenu = () => {
		setSelectedCategoryId(null);

		setForm((current) => ({
			...current,
			subcategory_id: '',
		}));
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-106.25">
				<form onSubmit={handleSubmit}>
					<DialogHeader>
						<DialogTitle>
							{type ? titles[type] : t('transactions.transaction')}
						</DialogTitle>

						<DialogDescription>
							{isEditing
								? t('transactions.editDescription')
								: t('transactions.createDescription')}
						</DialogDescription>
					</DialogHeader>

					{/* ACCOUNT */}
					<div className="grid gap-2">
						<Label>{t('transactions.account')}</Label>

						<Popover open={accountOpen} onOpenChange={setAccountOpen}>
							<PopoverTrigger
								render={
									<Button
										type="button"
										variant="outline"
										className="justify-start font-normal">
										{selectedAccount ? (
											<>
												<CategoryIcon
													name={selectedAccount.icon}
													className="mr-2 size-4"
												/>

												{selectedAccount.name}
											</>
										) : (
											<span className="text-muted-foreground">
												{t('transactions.selectAccount')}
											</span>
										)}
									</Button>
								}
							/>

							<PopoverContent className="w-64 p-2" align="start">
								<div className="grid gap-1">
									{accounts.map((account) => (
										<Button
											key={account.id}
											type="button"
											variant="ghost"
											className="w-full justify-start"
											onClick={() => {
												setForm((current) => ({
													...current,
													account_id: String(account.id),
													transfer_account_id:
														String(account.id) ===
														String(current.transfer_account_id)
															? ''
															: current.transfer_account_id,
												}));

												setAccountOpen(false);
											}}>
											<CategoryIcon
												name={account.icon}
												className="mr-3 size-5"
											/>

											<span className="flex-1 text-left">{account.name}</span>
										</Button>
									))}
								</div>
							</PopoverContent>
						</Popover>
					</div>

					{/* TRANSFER DESTINATION */}
					{type === 'transfer' && (
						<div className="grid gap-2">
							<Label>{t('transactions.transferAccount')}</Label>

							<Popover
								open={transferAccountOpen}
								onOpenChange={setTransferAccountOpen}>
								<PopoverTrigger
									render={
										<Button
											type="button"
											variant="outline"
											className="justify-start font-normal">
											{selectedTransferAccount ? (
												<>
													<CategoryIcon
														name={selectedTransferAccount.icon}
														className="mr-2 size-4"
													/>

													{selectedTransferAccount.name}
												</>
											) : (
												<span className="text-muted-foreground">
													{t('transactions.selectDestinationAccount')}
												</span>
											)}
										</Button>
									}
								/>

								<PopoverContent className="w-64 p-2" align="start">
									<div className="grid gap-1">
										{availableTransferAccounts.map((account) => (
											<Button
												key={account.id}
												type="button"
												variant="ghost"
												className="w-full justify-start"
												onClick={() => {
													setForm((current) => ({
														...current,
														transfer_account_id: String(account.id),
													}));

													setTransferAccountOpen(false);
												}}>
												<CategoryIcon
													name={account.icon}
													className="mr-3 size-5"
												/>

												<span className="flex-1 text-left">{account.name}</span>
											</Button>
										))}
									</div>
								</PopoverContent>
							</Popover>
						</div>
					)}

					{/* NAME */}
					<div className="grid gap-2">
						<Label htmlFor="transaction-name">{t('transactions.name')}</Label>

						<Input
							id="transaction-name"
							placeholder={
								type === 'transfer'
									? t('transactions.transferNamePlaceholder')
									: type === 'income'
										? t('transactions.incomeNamePlaceholder')
										: t('transactions.expenseNamePlaceholder')
							}
							value={form.name}
							onChange={(event) =>
								setForm((current) => ({
									...current,
									name: event.target.value,
								}))
							}
							required
						/>
					</div>

					{/* AMOUNT */}
					<div className="grid gap-2">
						<Label htmlFor="amount">{t('transactions.amount')}</Label>

						<Input
							id="amount"
							type="number"
							step="0.01"
							min="0"
							value={form.amount}
							onChange={(event) =>
								setForm((current) => ({
									...current,
									amount: event.target.value,
								}))
							}
							required
						/>
					</div>

					{/* EXPENSE AMOUNT TO RECEIVE */}
					{type === 'expense' && (
						<div className="grid gap-2">
							<Label htmlFor="amount-to-receive">
								{t('transactions.amountToReceive')}
							</Label>

							<Input
								id="amount-to-receive"
								type="number"
								step="0.01"
								min="0"
								value={form.amount_to_receive}
								onChange={(event) =>
									setForm((current) => ({
										...current,
										amount_to_receive: event.target.value,
									}))
								}
								required
							/>
						</div>
					)}

					{/* DATE */}
					<div className="grid gap-2">
						<Label htmlFor="transaction-date">{t('transactions.date')}</Label>

						<Popover>
							<PopoverTrigger
								render={
									<Button
										type="button"
										variant="outline"
										id="transaction-date"
										className="justify-start font-normal">
										{selectedDate
											? format(selectedDate, 'PPP', {
													locale: dateLocale,
												})
											: t('transactions.pickDate')}
									</Button>
								}
							/>

							<PopoverContent className="w-auto p-0" align="start">
								<Calendar
									mode="single"
									selected={selectedDate}
									onSelect={(date) => {
										if (!date) return;

										setForm((current) => ({
											...current,
											date: format(date, 'yyyy-MM-dd'),
										}));
									}}
									defaultMonth={selectedDate}
									locale={dateLocale}
								/>
							</PopoverContent>
						</Popover>
					</div>

					{/* TRANSFER READ ONLY SUBCATEGORY */}
					{type === 'transfer' && (
						<div className="grid gap-2">
							<Label>{t('transactions.subcategory')}</Label>

							<div className="flex h-10 items-center rounded-md border bg-muted/50 px-3 text-sm">
								<CategoryIcon
									name={internalTransferSubcategory?.icon}
									className="mr-2 size-4"
								/>

								<span>
									{internalTransferSubcategory
										? translateSubcategory(internalTransferSubcategory.name)
										: t('transactions.internalTransfer')}
								</span>
							</div>
						</div>
					)}

					{/* CATEGORY */}
					{type !== 'transfer' && (
						<div className="grid gap-2">
							<Label>{t('transactions.category')}</Label>

							<Popover
								open={categoryOpen}
								onOpenChange={(isOpen) => {
									setCategoryOpen(isOpen);

									if (!isOpen) {
										resetCategoryMenu();
									}
								}}>
								<PopoverTrigger
									render={
										<Button
											type="button"
											variant="outline"
											className="justify-start font-normal">
											{selectedSubcategory ? (
												<>
													<CategoryIcon
														name={selectedCategory?.icon}
														className="mr-2 size-4"
													/>

													{selectedCategory
														? translateCategory(selectedCategory.name)
														: null}

													<span className="mx-2 text-muted-foreground">/</span>

													<CategoryIcon
														name={selectedSubcategory.icon}
														className="mr-2 size-4"
													/>

													{translateSubcategory(selectedSubcategory.name)}
												</>
											) : (
												<span className="text-muted-foreground">
													{t('transactions.selectCategory')}
												</span>
											)}
										</Button>
									}
								/>

								<PopoverContent className="w-64 p-2" align="start">
									{selectedCategoryId === null ? (
										<div className="grid gap-1">
											{visibleCategories.map((category) => (
												<Button
													key={category.id}
													type="button"
													variant="ghost"
													className="w-full justify-start"
													onClick={() => handleCategorySelect(category)}>
													<CategoryIcon
														name={category.icon}
														className="mr-3 size-5"
													/>

													<span className="flex-1 text-left">
														{translateCategory(category.name)}
													</span>
												</Button>
											))}
										</div>
									) : (
										<div className="grid gap-1">
											<Button
												type="button"
												variant="ghost"
												className="mb-1 justify-start rounded-none border-b"
												onClick={resetCategoryMenu}>
												<CategoryIcon
													name={selectedCategory?.icon}
													className="mr-2 size-4"
												/>

												{selectedCategory
													? translateCategory(selectedCategory.name)
													: null}
											</Button>

											{filteredSubcategories.map((subcategory) => (
												<Button
													key={subcategory.id}
													type="button"
													variant="ghost"
													className="w-full justify-start"
													onClick={() => handleSubcategorySelect(subcategory)}>
													<CategoryIcon
														name={subcategory.icon}
														className="mr-3 size-5"
													/>

													{translateSubcategory(subcategory.name)}
												</Button>
											))}
										</div>
									)}
								</PopoverContent>
							</Popover>
						</div>
					)}

					{/* COUNTERPARTY */}
					{type !== 'transfer' && (
						<div className="grid gap-2">
							<Label htmlFor="counterparty-name">
								{type === 'income'
									? t('transactions.from')
									: t('transactions.to')}
							</Label>

							<Input
								id="counterparty-name"
								placeholder={
									type === 'income'
										? t('transactions.incomeCounterpartyPlaceholder')
										: t('transactions.expenseCounterpartyPlaceholder')
								}
								value={form.counterparty}
								onChange={(event) =>
									setForm((current) => ({
										...current,
										counterparty: event.target.value,
									}))
								}
							/>
						</div>
					)}

					<div className="flex items-center justify-between border-t pt-4">
						<Label htmlFor="transaction-checked">
							{t('transactions.paid')}
						</Label>

						<Switch
							id="transaction-checked"
							checked={form.checked}
							onCheckedChange={(checked) =>
								setForm((current) => ({
									...current,
									checked,
								}))
							}
						/>
					</div>

					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							onClick={() => onOpenChange(false)}>
							{t('common.cancel')}
						</Button>

						<Button
							type="submit"
							disabled={
								saving ||
								!form.account_id ||
								(type === 'transfer' && !form.transfer_account_id)
							}>
							{saving
								? t('transactions.saving')
								: isEditing
									? t('transactions.saveChanges')
									: t('transactions.createTransaction')}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
