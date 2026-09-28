'use client';

import { useEffect, useMemo, useState } from 'react';

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

const MAX_NAME_LENGTH = 50;
const MAX_COUNTERPARTY_LENGTH = 255;
const MAX_AMOUNT = 99999999.99;

const TRANSACTION_TYPES = new Set(['income', 'expense', 'transfer']);

function CategoryIcon({ name, className }) {
	const Icon = name ? iconMap[name] : null;

	if (!Icon) {
		return null;
	}

	return <Icon className={className} aria-hidden="true" />;
}

const getDefaultForm = () => ({
	date: format(new Date(), 'yyyy-MM-dd'),
	name: '',
	amount: 0,
	amount_to_receive: 0,
	counterparty: '',
	account_id: '',
	transfer_account_id: '',
	subcategory_id: '',
	checked: true,
});

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

	const [form, setForm] = useState(getDefaultForm);

	const [error, setError] = useState('');

	/*
	 * Reset error whenever the dialog opens/closes.
	 */
	useEffect(() => {
		if (open) {
			setError('');
		}
	}, [open]);

	/*
	 * Load categories, subcategories and preferences.
	 */
	useEffect(() => {
		if (!open) {
			return;
		}

		let cancelled = false;

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

				if (cancelled) {
					return;
				}

				setCategories(Array.isArray(categoriesData) ? categoriesData : []);

				setSubcategories(
					Array.isArray(subcategoriesData) ? subcategoriesData : [],
				);

				setCategoryPreferences(
					Array.isArray(categoryPreferencesData) ? categoryPreferencesData : [],
				);

				setSubcategoryPreferences(
					Array.isArray(subcategoryPreferencesData)
						? subcategoryPreferencesData
						: [],
				);
			} catch (requestError) {
				if (cancelled) {
					return;
				}

				console.error('Failed to load transaction data', requestError);

				setError(t('transactions.loadError'));
			}
		};

		loadData();

		return () => {
			cancelled = true;
		};
	}, [open, type, t]);

	/*
	 * Load accounts.
	 */
	useEffect(() => {
		if (!open) {
			return;
		}

		let cancelled = false;

		const loadAccounts = async () => {
			try {
				const accountsData = await getAccounts();

				if (cancelled) {
					return;
				}

				setAccounts(Array.isArray(accountsData) ? accountsData : []);
			} catch (requestError) {
				if (cancelled) {
					return;
				}

				console.error('Failed to load accounts', requestError);

				setError(t('transactions.loadError'));
			}
		};

		loadAccounts();

		return () => {
			cancelled = true;
		};
	}, [open, t]);

	/*
	 * Populate form when creating/editing.
	 */
	useEffect(() => {
		if (!open) {
			return;
		}

		setError('');

		if (transaction) {
			setForm({
				date: transaction.date ? transaction.date.split('T')[0] : '',

				name: transaction.name ?? '',

				amount:
					transaction.amount !== null && transaction.amount !== undefined
						? String(transaction.amount)
						: '',

				amount_to_receive:
					transaction.amount_to_receive !== null &&
					transaction.amount_to_receive !== undefined
						? String(transaction.amount_to_receive)
						: '',

				counterparty: transaction.counterparty ?? '',

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

			return;
		}

		setForm(getDefaultForm());
		setSelectedCategoryId(null);
	}, [open, transaction]);

	/*
	 * Create lookup maps.
	 */
	const categoryPreferencesMap = useMemo(
		() =>
			Object.fromEntries(
				categoryPreferences
					.filter((preference) => preference?.category?.id)
					.map((preference) => [preference.category.id, preference]),
			),
		[categoryPreferences],
	);

	const subcategoryPreferencesMap = useMemo(
		() =>
			Object.fromEntries(
				subcategoryPreferences
					.filter((preference) => preference?.subcategory?.id)
					.map((preference) => [preference.subcategory.id, preference]),
			),
		[subcategoryPreferences],
	);

	/*
	 * Visible categories.
	 */
	const visibleCategories = useMemo(
		() =>
			categories.filter((category) => {
				const preference = categoryPreferencesMap[category.id];

				return !preference?.hidden;
			}),
		[categories, categoryPreferencesMap],
	);

	/*
	 * Visible subcategories.
	 */
	const visibleSubcategories = useMemo(
		() =>
			subcategories.filter((subcategory) => {
				const categoryPreference =
					categoryPreferencesMap[subcategory.category?.id];

				const subcategoryPreference = subcategoryPreferencesMap[subcategory.id];

				return !categoryPreference?.hidden && !subcategoryPreference?.hidden;
			}),
		[subcategories, categoryPreferencesMap, subcategoryPreferencesMap],
	);

	/*
	 * Internal transfer subcategory.
	 */
	const internalTransferSubcategory = useMemo(
		() =>
			subcategories.find(
				(subcategory) =>
					subcategory.name?.toLowerCase() === 'internal transfer',
			),
		[subcategories],
	);

	/*
	 * Keep Internal Transfer selected for transfers.
	 */
	useEffect(() => {
		if (type === 'transfer' && !isEditing && internalTransferSubcategory) {
			setForm((current) => ({
				...current,
				subcategory_id: String(internalTransferSubcategory.id),
			}));
		}
	}, [type, isEditing, internalTransferSubcategory]);

	/*
	 * Selected objects.
	 */
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

	/*
	 * Validate form before sending anything to the API.
	 */
	const validateForm = () => {
		if (!TRANSACTION_TYPES.has(type)) {
			return t('transactions.invalidType');
		}

		if (!form.date) {
			return t('transactions.dateRequired');
		}

		if (!/^\d{4}-\d{2}-\d{2}$/.test(form.date)) {
			return t('transactions.invalidDate');
		}

		const name = form.name.trim();

		if (!name) {
			return t('transactions.nameRequired');
		}

		if (name.length > MAX_NAME_LENGTH) {
			return t('transactions.nameTooLong');
		}

		if (!form.account_id) {
			return t('transactions.accountRequired');
		}

		const amount = Number(form.amount);

		if (!Number.isFinite(amount) || amount <= 0 || amount > MAX_AMOUNT) {
			return t('transactions.invalidAmount');
		}

		if (type === 'transfer' && !form.transfer_account_id) {
			return t('transactions.transferAccountRequired');
		}

		if (
			type === 'transfer' &&
			String(form.account_id) === String(form.transfer_account_id)
		) {
			return t('transactions.sameTransferAccount');
		}

		if (type !== 'transfer') {
			const counterparty = form.counterparty.trim();

			if (counterparty.length > MAX_COUNTERPARTY_LENGTH) {
				return t('transactions.counterpartyTooLong');
			}
		}

		if (type === 'expense') {
			const amountToReceive =
				form.amount_to_receive === '' ? 0 : Number(form.amount_to_receive);

			if (
				!Number.isFinite(amountToReceive) ||
				amountToReceive < 0 ||
				amountToReceive > amount
			) {
				return t('transactions.invalidAmountToReceive');
			}
		}

		if (type !== 'transfer' && form.subcategory_id) {
			const validSubcategory = visibleSubcategories.some(
				(subcategory) => String(subcategory.id) === String(form.subcategory_id),
			);

			if (!validSubcategory) {
				return t('transactions.invalidSubcategory');
			}
		}

		return null;
	};

	/*
	 * Submit.
	 */
	const handleSubmit = async (event) => {
		event.preventDefault();

		if (saving) {
			return;
		}

		const validationError = validateForm();

		if (validationError) {
			setError(validationError);
			return;
		}

		try {
			setSaving(true);
			setError('');

			const amount = Number(form.amount);

			const payload = {
				date: form.date,
				name: form.name.trim(),
				amount,
				transaction_type: type,
				account_id: Number(form.account_id),
				checked: Boolean(form.checked),
			};

			if (type === 'transfer') {
				payload.transfer_account_id = Number(form.transfer_account_id);

				/*
				 * Internal Transfer is controlled by the application.
				 */
				if (internalTransferSubcategory) {
					payload.subcategory_id = Number(internalTransferSubcategory.id);
				}
			}

			if (type === 'income' || type === 'expense') {
				const counterparty = form.counterparty.trim();

				payload.counterparty = counterparty || null;

				if (type === 'expense') {
					payload.amount_to_receive =
						form.amount_to_receive === '' ? 0 : Number(form.amount_to_receive);
				}

				if (form.subcategory_id) {
					payload.subcategory_id = Number(form.subcategory_id);
				}
			}

			if (isEditing) {
				await updateTransaction(transaction.id, payload);
			} else {
				await createTransaction(payload);
			}

			onOpenChange(false);

			if (onCreated) {
				await onCreated();
			}
		} catch (requestError) {
			console.error('Failed to save transaction', requestError);

			/*
			 * Do not expose backend/internal errors directly.
			 */
			const status = requestError?.response?.status;

			if (status >= 400 && status < 500 && requestError?.response?.data) {
				const data = requestError.response.data;

				if (typeof data.detail === 'string') {
					setError(data.detail);
				} else {
					setError(t('transactions.saveError'));
				}
			} else {
				setError(t('transactions.saveError'));
			}
		} finally {
			setSaving(false);
		}
	};

	const handleAccountSelect = (account) => {
		setForm((current) => ({
			...current,
			account_id: String(account.id),
			transfer_account_id:
				String(account.id) === String(current.transfer_account_id)
					? ''
					: current.transfer_account_id,
		}));

		setAccountOpen(false);
	};

	const handleTransferAccountSelect = (account) => {
		setForm((current) => ({
			...current,
			transfer_account_id: String(account.id),
		}));

		setTransferAccountOpen(false);
	};

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

	const handleDialogChange = (nextOpen) => {
		if (saving) {
			return;
		}

		onOpenChange(nextOpen);
	};

	return (
		<Dialog open={open} onOpenChange={handleDialogChange}>
			<DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-106.25">
				<form onSubmit={handleSubmit} noValidate>
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

					<div className="grid gap-5 py-6">
						{/* ACCOUNT */}
						<div className="grid gap-2">
							<Label>{t('transactions.account')}</Label>

							<Popover open={accountOpen} onOpenChange={setAccountOpen}>
								<PopoverTrigger
									render={
										<Button
											type="button"
											variant="outline"
											className="justify-start font-normal"
											disabled={saving}>
											{selectedAccount ? (
												<>
													<CategoryIcon
														name={selectedAccount.icon}
														className="mr-2 size-4"
													/>

													<span className="truncate">
														{selectedAccount.name}
													</span>
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
									<div className="grid max-h-60 gap-1 overflow-y-auto">
										{accounts.map((account) => (
											<Button
												key={account.id}
												type="button"
												variant="ghost"
												className="w-full justify-start"
												onClick={() => handleAccountSelect(account)}>
												<CategoryIcon
													name={account.icon}
													className="mr-3 size-5"
												/>

												<span className="flex-1 truncate text-left">
													{account.name}
												</span>
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
												className="justify-start font-normal"
												disabled={saving}>
												{selectedTransferAccount ? (
													<>
														<CategoryIcon
															name={selectedTransferAccount.icon}
															className="mr-2 size-4"
														/>

														<span className="truncate">
															{selectedTransferAccount.name}
														</span>
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
										<div className="grid max-h-60 gap-1 overflow-y-auto">
											{availableTransferAccounts.map((account) => (
												<Button
													key={account.id}
													type="button"
													variant="ghost"
													className="w-full justify-start"
													onClick={() => handleTransferAccountSelect(account)}>
													<CategoryIcon
														name={account.icon}
														className="mr-3 size-5"
													/>

													<span className="flex-1 truncate text-left">
														{account.name}
													</span>
												</Button>
											))}
										</div>
									</PopoverContent>
								</Popover>
							</div>
						)}

						{/* NAME */}
						<div className="grid gap-2">
							<div className="flex items-center justify-between">
								<Label htmlFor="transaction-name">
									{t('transactions.name')}
								</Label>

								<span className="text-xs text-muted-foreground">
									{form.name.length}/{MAX_NAME_LENGTH}
								</span>
							</div>

							<Input
								id="transaction-name"
								name="transaction-name"
								maxLength={MAX_NAME_LENGTH}
								placeholder={
									type === 'transfer'
										? t('transactions.transferNamePlaceholder')
										: type === 'income'
											? t('transactions.incomeNamePlaceholder')
											: t('transactions.expenseNamePlaceholder')
								}
								value={form.name}
								disabled={saving}
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
								name="amount"
								type="number"
								inputMode="decimal"
								step="0.01"
								min="0.01"
								max={MAX_AMOUNT}
								value={form.amount}
								disabled={saving}
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
									name="amount-to-receive"
									type="number"
									inputMode="decimal"
									step="0.01"
									min="0"
									max={MAX_AMOUNT}
									value={form.amount_to_receive}
									disabled={saving}
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
											className="justify-start font-normal"
											disabled={saving}>
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
											if (!date) {
												return;
											}

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

						{/* TRANSFER SUBCATEGORY */}
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
												className="justify-start font-normal"
												disabled={saving}>
												{selectedSubcategory ? (
													<>
														<CategoryIcon
															name={selectedCategory?.icon}
															className="mr-2 size-4"
														/>

														<span className="truncate">
															{selectedCategory
																? translateCategory(selectedCategory.name)
																: null}
														</span>

														<span className="mx-2 text-muted-foreground">
															/
														</span>

														<CategoryIcon
															name={selectedSubcategory.icon}
															className="mr-2 size-4"
														/>

														<span className="truncate">
															{translateSubcategory(selectedSubcategory.name)}
														</span>
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
											<div className="grid max-h-60 gap-1 overflow-y-auto">
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

														<span className="flex-1 truncate text-left">
															{translateCategory(category.name)}
														</span>
													</Button>
												))}
											</div>
										) : (
											<div className="grid max-h-60 gap-1 overflow-y-auto">
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
														onClick={() =>
															handleSubcategorySelect(subcategory)
														}>
														<CategoryIcon
															name={subcategory.icon}
															className="mr-3 size-5"
														/>

														<span className="truncate">
															{translateSubcategory(subcategory.name)}
														</span>
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
								<div className="flex items-center justify-between">
									<Label htmlFor="counterparty-name">
										{type === 'income'
											? t('transactions.from')
											: t('transactions.to')}
									</Label>

									<span className="text-xs text-muted-foreground">
										{form.counterparty.length}/{MAX_COUNTERPARTY_LENGTH}
									</span>
								</div>

								<Input
									id="counterparty-name"
									name="counterparty"
									maxLength={MAX_COUNTERPARTY_LENGTH}
									placeholder={
										type === 'income'
											? t('transactions.incomeCounterpartyPlaceholder')
											: t('transactions.expenseCounterpartyPlaceholder')
									}
									value={form.counterparty}
									disabled={saving}
									onChange={(event) =>
										setForm((current) => ({
											...current,
											counterparty: event.target.value,
										}))
									}
								/>
							</div>
						)}

						{/* ERROR */}
						{error && (
							<div
								className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
								role="alert"
								aria-live="polite">
								{error}
							</div>
						)}

						{/* CHECKED */}
						<div className="flex items-center justify-between border-t pt-4">
							<Label htmlFor="transaction-checked">
								{t('transactions.paid')}
							</Label>

							<Switch
								id="transaction-checked"
								checked={form.checked}
								disabled={saving}
								onCheckedChange={(checked) =>
									setForm((current) => ({
										...current,
										checked,
									}))
								}
							/>
						</div>
					</div>

					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							onClick={() => handleDialogChange(false)}
							disabled={saving}>
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
