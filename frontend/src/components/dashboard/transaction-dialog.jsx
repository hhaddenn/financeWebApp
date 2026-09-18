'use client';

import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
	DialogFooter,
} from '@/components/ui/dialog';

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

import { createTransaction, updateTransaction } from '@/api/transactions';

import { getCategories, getSubcategories } from '@/api/categories';

import { getAccounts } from '@/api/accounts';
import { iconMap } from '@/lib/icons';

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
	const isEditing = Boolean(transaction);

	const titles = {
		income: isEditing ? 'Edit Income' : 'Add Income',
		expense: isEditing ? 'Edit Expense' : 'Add Expense',
		transfer: isEditing ? 'Edit Transfer' : 'Make Transfer',
	};

	const [saving, setSaving] = useState(false);

	const [categories, setCategories] = useState([]);
	const [subcategories, setSubcategories] = useState([]);
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
	});

	/*
	 * Load categories and subcategories.
	 */
	useEffect(() => {
		const loadData = async () => {
			try {
				const [categoriesData, subcategoriesData] = await Promise.all([
					getCategories(),
					getSubcategories(),
				]);

				setCategories(categoriesData);
				setSubcategories(subcategoriesData);
			} catch (error) {
				console.error('Failed to load transaction data:', error);
			}
		};

		loadData();
	}, []);

	/*
	 * Reload accounts every time the dialog opens.
	 *
	 * This keeps the account list up to date after creating,
	 * editing or deleting accounts.
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
	 *
	 * When creating a new transaction:
	 * - amount starts at 0
	 * - amount_to_receive starts at 0
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
			});

			setSelectedCategoryId(null);
		}
	}, [open, transaction]);

	/*
	 * Internal Transfer is read-only in the UI.
	 *
	 * The backend is responsible for assigning the
	 * Internal Transfer subcategory.
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

			/*
			 * Build the payload according to transaction type.
			 */

			const payload = {
				date: form.date,
				name: form.name,
				amount: Number(form.amount),
				transaction_type: type,
				account_id: Number(form.account_id),
			};

			/*
			 * TRANSFER
			 *
			 * Only send:
			 * - account_id
			 * - transfer_account_id
			 * - amount
			 * - name
			 * - date
			 * - transaction_type
			 *
			 * No subcategory_id.
			 * No counterparty.
			 * No amount_to_receive.
			 */
			if (type === 'transfer') {
				payload.transfer_account_id = Number(form.transfer_account_id);
			}

			/*
			 * INCOME / EXPENSE
			 */
			if (type === 'income' || type === 'expense') {
				payload.counterparty = form.counterparty || null;

				/*
				 * amount_to_receive only exists for expenses.
				 */
				if (type === 'expense') {
					payload.amount_to_receive = Number(form.amount_to_receive);
				}

				/*
				 * Subcategory is editable for income/expense.
				 */
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

	const filteredSubcategories = subcategories.filter(
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
						<DialogTitle>{type ? titles[type] : 'Transaction'}</DialogTitle>

						<DialogDescription>
							{isEditing
								? 'Edit the transaction details.'
								: 'Fill in the details for the new transaction.'}
						</DialogDescription>
					</DialogHeader>

					<div className="grid gap-5 py-6">
						{/* ACCOUNT */}

						<div className="grid gap-2">
							<Label>Account</Label>

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
													Select an account
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

						{/* NAME */}

						<div className="grid gap-2">
							<Label htmlFor="transaction-name">Name</Label>

							<Input
								id="transaction-name"
								placeholder={
									type === 'transfer'
										? 'Ex: Transfer to savings'
										: type === 'income'
											? 'Ex: Money lent'
											: 'Ex: Fill car tank'
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
							<Label htmlFor="amount">Amount</Label>

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
								<Label htmlFor="amount-to-receive">Amount to Receive</Label>

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

						{/* TRANSFER DESTINATION */}

						{type === 'transfer' && (
							<>
								<div className="grid gap-2">
									<Label>Account to Transfer</Label>

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
															Select destination account
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

														<span className="flex-1 text-left">
															{account.name}
														</span>
													</Button>
												))}
											</div>
										</PopoverContent>
									</Popover>
								</div>

								{/* READ ONLY SUBCATEGORY */}

								<div className="grid gap-2">
									<Label>Subcategory</Label>

									<div className="flex h-10 items-center rounded-md border bg-muted/50 px-3 text-sm">
										<CategoryIcon
											name={internalTransferSubcategory?.icon}
											className="mr-2 size-4"
										/>

										<span>
											{internalTransferSubcategory?.name || 'Internal Transfer'}
										</span>

										<span className="ml-auto text-xs text-muted-foreground">
											Read only
										</span>
									</div>
								</div>
							</>
						)}

						{/* DATE */}

						<div className="grid gap-2">
							<Label htmlFor="transaction-date">Date</Label>

							<Popover>
								<PopoverTrigger
									render={
										<Button
											type="button"
											variant="outline"
											id="transaction-date"
											className="justify-start font-normal">
											{selectedDate
												? format(selectedDate, 'PPP')
												: 'Pick a date'}
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
									/>
								</PopoverContent>
							</Popover>
						</div>

						{/* CATEGORY */}

						{type !== 'transfer' && (
							<div className="grid gap-2">
								<Label>Category</Label>

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

														{selectedCategory?.name}

														<span className="mx-2 text-muted-foreground">
															/
														</span>

														<CategoryIcon
															name={selectedSubcategory.icon}
															className="mr-2 size-4"
														/>

														{selectedSubcategory.name}
													</>
												) : (
													<span className="text-muted-foreground">
														Select a category
													</span>
												)}
											</Button>
										}
									/>

									<PopoverContent className="w-64 p-2" align="start">
										{selectedCategoryId === null ? (
											<div className="grid gap-1">
												{categories.map((category) => (
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
															{category.name}
														</span>

														<span className="text-muted-foreground">›</span>
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
													←
													<CategoryIcon
														name={selectedCategory?.icon}
														className="mr-2 size-4"
													/>
													{selectedCategory?.name}
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

														{subcategory.name}
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
									{type === 'income' ? 'From' : 'To'}
								</Label>

								<Input
									id="counterparty-name"
									placeholder={
										type === 'income'
											? 'Ex: João (optional)'
											: 'Ex: Galp (optional)'
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
					</div>

					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							onClick={() => onOpenChange(false)}>
							Cancel
						</Button>

						<Button
							type="submit"
							disabled={
								saving ||
								!form.account_id ||
								(type === 'transfer' && !form.transfer_account_id)
							}>
							{saving
								? 'Saving...'
								: isEditing
									? 'Save Changes'
									: 'Create Transaction'}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
