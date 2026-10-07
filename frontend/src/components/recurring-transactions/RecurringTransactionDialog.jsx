/* oxlint-disable react/set-state-in-effect */

import { useEffect, useState } from 'react';

import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { getAccounts } from '@/api/accounts';
import { getSubcategories } from '@/api/categories';

import {
	createRecurringTransaction,
	updateRecurringTransaction,
} from '@/api/recurringTransactions';

const getDefaultForm = () => ({
	name: '',
	amount: '',
	transaction_type: 'expense',
	account: '',
	subcategory: '',
	counterparty: '',
	frequency: 'monthly',
	day_of_week: '',
	day_of_month: '1',
	month: '',
	active: true,
});

const getValueId = (value) => {
	if (value && typeof value === 'object') {
		return value.id;
	}

	return value;
};

export default function RecurringTransactionDialog({
	open,
	onOpenChange,
	transaction = null,
	onSaved,
}) {
	const isEditing = Boolean(transaction);

	const [form, setForm] = useState(getDefaultForm);
	const [accounts, setAccounts] = useState([]);
	const [subcategories, setSubcategories] = useState([]);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState('');

	useEffect(() => {
		if (!open) {
			return;
		}

		setError('');

		if (transaction) {
			setForm({
				name: transaction.name ?? '',
				amount: transaction.amount ?? '',
				transaction_type: transaction.transaction_type ?? 'expense',
				account: String(getValueId(transaction.account) ?? ''),
				subcategory: String(getValueId(transaction.subcategory) ?? ''),
				counterparty: transaction.counterparty ?? '',
				frequency: transaction.frequency ?? 'monthly',
				day_of_week: transaction.day_of_week ?? '',
				day_of_month: transaction.day_of_month ?? '',
				month: transaction.month ?? '',
				active: transaction.active ?? true,
			});
		} else {
			setForm(getDefaultForm());
		}

		Promise.all([getAccounts(), getSubcategories()])
			.then(([accountsData, subcategoriesData]) => {
				setAccounts(accountsData);
				setSubcategories(subcategoriesData);
			})
			.catch((loadError) => {
				console.error(
					'Failed to load recurring transaction form data:',
					loadError,
				);
			});
	}, [open, transaction]);

	const updateField = (field, value) => {
		setForm((current) => ({
			...current,
			[field]: value,
		}));
	};

	const buildSchedulePayload = () => {
		if (form.frequency === 'weekly') {
			return {
				frequency: 'weekly',
				day_of_week: Number(form.day_of_week),
				day_of_month: null,
				month: null,
			};
		}

		if (form.frequency === 'monthly') {
			return {
				frequency: 'monthly',
				day_of_week: null,
				day_of_month: Number(form.day_of_month),
				month: null,
			};
		}

		return {
			frequency: 'yearly',
			day_of_week: null,
			day_of_month: Number(form.day_of_month),
			month: Number(form.month),
		};
	};

	const handleSubmit = async (event) => {
		event.preventDefault();
		setError('');

		if (!form.name.trim() || !form.amount || !form.account) {
			setError('Name, amount and account are required.');
			return;
		}

		if (form.frequency === 'weekly' && form.day_of_week === '') {
			setError('Choose a weekday.');
			return;
		}

		if (
			(form.frequency === 'monthly' || form.frequency === 'yearly') &&
			form.day_of_month === ''
		) {
			setError('Choose a day of the month.');
			return;
		}

		if (form.frequency === 'yearly' && form.month === '') {
			setError('Choose a month.');
			return;
		}

		const payload = {
			name: form.name.trim(),
			amount: Number(form.amount),
			transaction_type: form.transaction_type,
			account: Number(form.account),
			subcategory: form.subcategory ? Number(form.subcategory) : null,
			counterparty: form.counterparty.trim(),
			active: form.active,
			...buildSchedulePayload(),
		};

		try {
			setSaving(true);

			if (isEditing) {
				await updateRecurringTransaction(transaction.id, payload);
			} else {
				await createRecurringTransaction(payload);
			}

			onOpenChange(false);
			await onSaved?.();
		} catch (saveError) {
			console.error('Failed to save recurring transaction:', saveError);
			setError('Could not save recurring transaction.');
		} finally {
			setSaving(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
				<form onSubmit={handleSubmit}>
					<DialogHeader>
						<DialogTitle>
							{isEditing
								? 'Edit recurring transaction'
								: 'Add recurring transaction'}
						</DialogTitle>

						<DialogDescription>
							Configure when this transaction should repeat.
						</DialogDescription>
					</DialogHeader>

					<div className="space-y-4 py-6">
						<div className="space-y-2">
							<Label htmlFor="recurring-name">Name</Label>

							<Input
								id="recurring-name"
								value={form.name}
								onChange={(event) => updateField('name', event.target.value)}
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="recurring-amount">Amount</Label>

							<Input
								id="recurring-amount"
								type="number"
								min="0"
								step="0.01"
								value={form.amount}
								onChange={(event) => updateField('amount', event.target.value)}
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="recurring-type">Type</Label>

							<select
								id="recurring-type"
								className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm"
								value={form.transaction_type}
								onChange={(event) =>
									updateField('transaction_type', event.target.value)
								}>
								<option value="expense">Expense</option>
								<option value="income">Income</option>
							</select>
						</div>

						<div className="space-y-2">
							<Label htmlFor="recurring-account">Account</Label>

							<select
								id="recurring-account"
								className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm"
								value={form.account}
								onChange={(event) =>
									updateField('account', event.target.value)
								}>
								<option value="">Select account</option>

								{accounts.map((account) => (
									<option key={account.id} value={account.id}>
										{account.name}
									</option>
								))}
							</select>
						</div>

						<div className="space-y-2">
							<Label htmlFor="recurring-subcategory">Subcategory</Label>

							<select
								id="recurring-subcategory"
								className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm"
								value={form.subcategory}
								onChange={(event) =>
									updateField('subcategory', event.target.value)
								}>
								<option value="">No subcategory</option>

								{subcategories.map((subcategory) => (
									<option key={subcategory.id} value={subcategory.id}>
										{subcategory.name}
									</option>
								))}
							</select>
						</div>

						<div className="space-y-2">
							<Label htmlFor="recurring-counterparty">Counterparty</Label>

							<Input
								id="recurring-counterparty"
								value={form.counterparty}
								onChange={(event) =>
									updateField('counterparty', event.target.value)
								}
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="recurring-frequency">Frequency</Label>

							<select
								id="recurring-frequency"
								className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm"
								value={form.frequency}
								onChange={(event) =>
									updateField('frequency', event.target.value)
								}>
								<option value="weekly">Weekly</option>
								<option value="monthly">Monthly</option>
								<option value="yearly">Yearly</option>
							</select>
						</div>

						{form.frequency === 'weekly' && (
							<div className="space-y-2">
								<Label htmlFor="recurring-weekday">Weekday</Label>

								<select
									id="recurring-weekday"
									className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm"
									value={form.day_of_week}
									onChange={(event) =>
										updateField('day_of_week', event.target.value)
									}>
									<option value="">Select weekday</option>
									<option value="0">Monday</option>
									<option value="1">Tuesday</option>
									<option value="2">Wednesday</option>
									<option value="3">Thursday</option>
									<option value="4">Friday</option>
									<option value="5">Saturday</option>
									<option value="6">Sunday</option>
								</select>
							</div>
						)}

						{(form.frequency === 'monthly' || form.frequency === 'yearly') && (
							<div className="space-y-2">
								<Label htmlFor="recurring-day">Day of month</Label>

								<Input
									id="recurring-day"
									type="number"
									min="1"
									max="31"
									value={form.day_of_month}
									onChange={(event) =>
										updateField('day_of_month', event.target.value)
									}
								/>
							</div>
						)}

						{form.frequency === 'yearly' && (
							<div className="space-y-2">
								<Label htmlFor="recurring-month">Month</Label>

								<select
									id="recurring-month"
									className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm"
									value={form.month}
									onChange={(event) =>
										updateField('month', event.target.value)
									}>
									<option value="">Select month</option>
									<option value="1">January</option>
									<option value="2">February</option>
									<option value="3">March</option>
									<option value="4">April</option>
									<option value="5">May</option>
									<option value="6">June</option>
									<option value="7">July</option>
									<option value="8">August</option>
									<option value="9">September</option>
									<option value="10">October</option>
									<option value="11">November</option>
									<option value="12">December</option>
								</select>
							</div>
						)}

						{error && <p className="text-destructive text-sm">{error}</p>}
					</div>

					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							onClick={() => onOpenChange(false)}
							disabled={saving}>
							Cancel
						</Button>

						<Button type="submit" disabled={saving}>
							{saving ? 'Saving...' : isEditing ? 'Save' : 'Create'}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
