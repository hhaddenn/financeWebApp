'use client';

import { useEffect, useState } from 'react';

import {
	Landmark,
	Wallet,
	CreditCard,
	PiggyBank,
	Banknote,
	Plus,
	ChartNoAxesCombined,
	EllipsisVerticalIcon,
} from 'lucide-react';

import { Card, CardContent, CardHeader } from '@/components/ui/card';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';

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
	getAccounts,
	createAccount,
	updateAccount,
	deleteAccount,
} from '@/api/accounts';

const accountIcons = {
	landmark: Landmark,
	wallet: Wallet,
	credit_card: CreditCard,
	piggy_bank: PiggyBank,
	banknote: Banknote,
	investment: ChartNoAxesCombined,
};

const iconOptions = [
	{
		value: 'landmark',
		label: 'Bank',
		icon: Landmark,
	},
	{
		value: 'wallet',
		label: 'Wallet',
		icon: Wallet,
	},
	{
		value: 'credit_card',
		label: 'Credit Card',
		icon: CreditCard,
	},
	{
		value: 'piggy_bank',
		label: 'Piggy Bank',
		icon: PiggyBank,
	},
	{
		value: 'banknote',
		label: 'Money',
		icon: Banknote,
	},
	{
		value: 'investment',
		label: 'Investment',
		icon: ChartNoAxesCombined,
	},
];

export function SectionCards() {
	const [accounts, setAccounts] = useState([]);
	const [loading, setLoading] = useState(true);

	// Create / Edit dialog
	const [dialogOpen, setDialogOpen] = useState(false);
	const [creating, setCreating] = useState(false);
	const [editingAccount, setEditingAccount] = useState(null);

	// Delete confirmation
	const [accountToDelete, setAccountToDelete] = useState(null);
	const [deleting, setDeleting] = useState(false);

	// Error dialog
	const [errorDialogOpen, setErrorDialogOpen] = useState(false);
	const [errorMessage, setErrorMessage] = useState('');

	// Form
	const [form, setForm] = useState({
		name: '',
		initial_balance: '',
		icon: 'landmark',
	});

	const showError = (error) => {
		console.error(error);

		let message = 'An unexpected error occurred.';

		if (error.response?.data) {
			const data = error.response.data;

			if (typeof data === 'string') {
				message = data;
			} else if (data.detail) {
				message = data.detail;
			} else {
				const messages = Object.entries(data)
					.map(([field, errors]) => {
						const text = Array.isArray(errors)
							? errors.join(', ')
							: String(errors);

						return `${field}: ${text}`;
					})
					.join('\n');

				if (messages) {
					message = messages;
				}
			}
		} else if (error.message) {
			message = error.message;
		}

		setErrorMessage(message);
		setErrorDialogOpen(true);
	};

	const loadAccounts = async () => {
		try {
			setLoading(true);

			const data = await getAccounts();

			setAccounts(data);
		} catch (error) {
			showError(error);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		loadAccounts();
	}, []);

	// Open create dialog
	const handleOpenCreate = () => {
		setEditingAccount(null);

		setForm({
			name: '',
			initial_balance: '',
			icon: 'landmark',
		});

		setDialogOpen(true);
	};

	// Open edit dialog
	const handleOpenEdit = (account) => {
		setEditingAccount(account);

		setForm({
			name: account.name,
			initial_balance: account.balance ?? '',
			icon: account.icon || 'landmark',
		});

		setDialogOpen(true);
	};

	const handleSubmit = async (event) => {
		event.preventDefault();

		if (!form.name.trim()) {
			setErrorMessage('Give a name to the account.');
			setErrorDialogOpen(true);
			return;
		}

		try {
			setCreating(true);

			if (editingAccount) {
				await updateAccount(editingAccount.id, {
					name: form.name.trim(),
					initial_balance: Number(form.initial_balance) || 0,
					icon: form.icon,
				});
			} else {
				await createAccount({
					name: form.name.trim(),
					initial_balance: Number(form.initial_balance) || 0,
					icon: form.icon,
				});
			}

			setForm({
				name: '',
				initial_balance: '',
				icon: 'landmark',
			});

			setEditingAccount(null);
			setDialogOpen(false);

			await loadAccounts();
		} catch (error) {
			showError(error);
		} finally {
			setCreating(false);
		}
	};

	// Open delete confirmation
	const handleDeleteRequest = (account) => {
		setAccountToDelete(account);
	};

	// Actually delete account
	const handleDeleteConfirm = async () => {
		if (!accountToDelete) {
			return;
		}

		try {
			setDeleting(true);

			await deleteAccount(accountToDelete.id);

			setAccountToDelete(null);

			await loadAccounts();
			window.location.reload();
		} catch (error) {
			showError(error);
		} finally {
			setDeleting(false);
		}
	};

	if (loading) {
		return <p>Loading Accounts...</p>;
	}

	return (
		<>
			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
				{accounts.map((account) => {
					const Icon = accountIcons[account.icon] || Landmark;

					return (
						<Card key={account.id} className="shadow-none">
							<CardHeader className="pb-2">
								<div className="flex items-center justify-between gap-2">
									<div className="flex items-center gap-2">
										<div className="flex size-9 items-center justify-center rounded-md bg-muted">
											<Icon className="size-5 text-muted-foreground" />
										</div>

										<p className="text-sm text-muted-foreground">
											{account.name}
										</p>
									</div>

									{/* Account actions */}
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
											<DropdownMenuItem onClick={() => handleOpenEdit(account)}>
												Edit
											</DropdownMenuItem>

											<DropdownMenuSeparator />

											<DropdownMenuItem
												variant="destructive"
												disabled={deleting}
												onClick={() => handleDeleteRequest(account)}>
												Delete
											</DropdownMenuItem>
										</DropdownMenuContent>
									</DropdownMenu>
								</div>
							</CardHeader>

							<CardContent>
								<div className="flex items-end justify-between gap-4">
									<p className="text-2xl font-semibold tracking-tight tabular-nums">
										€{Number(account.balance).toFixed(2)}
									</p>
								</div>
							</CardContent>
						</Card>
					);
				})}

				{/* Add account */}
				<button
					type="button"
					onClick={handleOpenCreate}
					className="flex min-h-37.5 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed bg-transparent transition-colors hover:bg-muted/50">
					<div className="mb-2 flex size-10 items-center justify-center rounded-full bg-muted">
						<Plus className="size-5 text-muted-foreground" />
					</div>

					<span className="text-sm font-medium">Add account</span>

					<span className="mt-1 text-xs text-muted-foreground">
						Create a new account
					</span>
				</button>
			</div>

			{/* Create / Edit dialog */}
			<Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
				<DialogContent className="sm:max-w-106.25">
					<form onSubmit={handleSubmit}>
						<DialogHeader>
							<DialogTitle>
								{editingAccount ? 'Edit Account' : 'New Account'}
							</DialogTitle>

							<DialogDescription>
								{editingAccount
									? 'Update the details of your account.'
									: 'Fill in the details for the new account.'}
							</DialogDescription>
						</DialogHeader>

						<div className="grid gap-5 py-6">
							{/* Name */}
							<div className="grid gap-2">
								<Label htmlFor="account-name">Name</Label>

								<Input
									id="account-name"
									placeholder="Ex: Main Account"
									value={form.name}
									onChange={(event) =>
										setForm({
											...form,
											name: event.target.value,
										})
									}
									required
								/>
							</div>

							{/* Balance */}
							<div className="grid gap-2">
								<Label htmlFor="account-balance">
									{editingAccount ? 'Current Balance' : 'Initial Balance'}
								</Label>

								<Input
									id="account-balance"
									type="number"
									step="0.01"
									placeholder="0.00"
									value={form.initial_balance}
									onChange={(event) =>
										setForm({
											...form,
											initial_balance: event.target.value,
										})
									}
								/>
							</div>

							{/* Icon */}
							<div className="grid gap-2">
								<Label>Icon</Label>

								<div className="grid grid-cols-6 gap-2">
									{iconOptions.map((option) => {
										const Icon = option.icon;
										const selected = form.icon === option.value;

										return (
											<button
												key={option.value}
												type="button"
												title={option.label}
												onClick={() =>
													setForm({
														...form,
														icon: option.value,
													})
												}
												className={`flex size-12 items-center justify-center rounded-md border transition-colors ${
													selected
														? 'border-primary bg-primary text-primary-foreground'
														: 'hover:bg-muted'
												}`}>
												<Icon className="size-5" />
											</button>
										);
									})}
								</div>
							</div>
						</div>

						<DialogFooter>
							<Button
								type="button"
								variant="outline"
								onClick={() => setDialogOpen(false)}>
								Cancel
							</Button>

							<Button type="submit" disabled={creating}>
								{creating
									? 'Saving...'
									: editingAccount
										? 'Save Changes'
										: 'Create Account'}
							</Button>
						</DialogFooter>
					</form>
				</DialogContent>
			</Dialog>

			{/* Delete confirmation */}
			<AlertDialog
				open={accountToDelete !== null}
				onOpenChange={(open) => {
					if (!open && !deleting) {
						setAccountToDelete(null);
					}
				}}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Delete account?</AlertDialogTitle>

						<AlertDialogDescription>
							Are you sure you want to delete{' '}
							<span className="font-medium text-foreground">
								"{accountToDelete?.name}"
							</span>
							?
							<br />
							<br />
							This action cannot be undone.
							All transactions associated with this account will be deleted.
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

			{/* Error dialog */}
			<Dialog open={errorDialogOpen} onOpenChange={setErrorDialogOpen}>
				<DialogContent className="sm:max-w-106.25">
					<DialogHeader>
						<DialogTitle>An error occurred</DialogTitle>

						<DialogDescription className="whitespace-pre-line">
							{errorMessage}
						</DialogDescription>
					</DialogHeader>

					<DialogFooter>
						<Button type="button" onClick={() => setErrorDialogOpen(false)}>
							OK
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
}
