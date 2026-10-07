import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';

const weekdays = [
	'Monday',
	'Tuesday',
	'Wednesday',
	'Thursday',
	'Friday',
	'Saturday',
	'Sunday',
];

function getSchedule(transaction) {
	if (transaction.frequency === 'weekly') {
		return `Weekly · ${weekdays[transaction.day_of_week]}`;
	}

	if (transaction.frequency === 'monthly') {
		return `Monthly · Day ${transaction.day_of_month}`;
	}

	if (transaction.frequency === 'yearly') {
		return `Yearly · ${transaction.day_of_month}/${transaction.month}`;
	}

	return transaction.frequency;
}

export default function RecurringTransactionCard({
	transaction,
	onEdit,
	onDelete,
	onToggleActive,
}) {
	return (
		<Card>
			<CardHeader className="flex flex-row items-start justify-between gap-4">
				<div className="space-y-1">
					<CardTitle>{transaction.name}</CardTitle>

					<p className="text-muted-foreground text-sm capitalize">
						{transaction.transaction_type}
					</p>
				</div>

				<Switch
					checked={transaction.active}
					onCheckedChange={(checked) => onToggleActive(transaction, checked)}
				/>
			</CardHeader>

			<CardContent className="space-y-4">
				<div>
					<p className="text-2xl font-semibold">{transaction.amount}</p>

					<p className="text-muted-foreground text-sm">
						{getSchedule(transaction)}
					</p>
				</div>

				{transaction.counterparty && (
					<p className="text-sm">
						<span className="text-muted-foreground">Counterparty:</span>{' '}
						{transaction.counterparty}
					</p>
				)}

				<p className="text-sm">
					<span className="text-muted-foreground">Next:</span>{' '}
					{transaction.next_run_at ?? '—'}
				</p>

				<div className="flex gap-2">
					<Button
						type="button"
						variant="outline"
						size="sm"
						onClick={() => onEdit(transaction)}>
						Edit
					</Button>

					<Button
						type="button"
						variant="destructive"
						size="sm"
						onClick={() => onDelete(transaction)}>
						Delete
					</Button>
				</div>
			</CardContent>
		</Card>
	);
}
