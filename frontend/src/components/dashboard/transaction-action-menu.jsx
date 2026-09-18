'use client';

import { useState } from 'react';

import { ArrowLeftRight, Minus, Plus, X } from 'lucide-react';

import { Button } from '@/components/ui/button';

import { TransactionDialog } from './transaction-dialog';

export function TransactionActionMenu() {
	const [open, setOpen] = useState(false);
	const [transactionType, setTransactionType] = useState(null);

	const handleIncome = () => {
		setOpen(false);
		setTransactionType('income');
	};

	const handleExpense = () => {
		setOpen(false);
		setTransactionType('expense');
	};

	const handleTransfer = () => {
		setOpen(false);
		setTransactionType('transfer');
	};

	const handleDialogClose = (isOpen) => {
		if (!isOpen) {
			setTransactionType(null);
		}
	};

	return (
		<>
			<div className="fixed bottom-6 right-6 z-50 flex flex-col items-center gap-3">
				{open && (
					<div className="flex flex-col items-center gap-3">
						<button
							type="button"
							onClick={handleIncome}
							className="
                flex h-12 w-12 items-center justify-center
                rounded-full bg-emerald-600 text-white shadow-md
                transition-transform hover:scale-105 active:scale-95
                cursor-pointer
              ">
							<Plus className="h-5 w-5" />
							<span className="sr-only">Income</span>
						</button>

						<button
							type="button"
							onClick={handleExpense}
							className="
                flex h-12 w-12 items-center justify-center
                rounded-full bg-red-600 text-white shadow-md
                transition-transform hover:scale-105 active:scale-95
                cursor-pointer
              ">
							<Minus className="h-5 w-5" />
							<span className="sr-only">Expense</span>
						</button>

						<button
							type="button"
							onClick={handleTransfer}
							className="
                flex h-12 w-12 items-center justify-center
                rounded-full bg-muted text-foreground shadow-md
                transition-transform hover:scale-105 active:scale-95
                cursor-pointer
              ">
							<ArrowLeftRight className="h-5 w-5" />
							<span className="sr-only">Transfer</span>
						</button>
					</div>
				)}

				<Button
					type="button"
					size="icon"
					onClick={() => setOpen((current) => !current)}
					className="
            h-14 w-14 rounded-full
            bg-neutral-950 text-white shadow-lg
            transition-transform
            hover:scale-105 active:scale-95
            hover:bg-neutral-950 hover:text-white
            focus:bg-neutral-950 focus:text-white
            active:bg-neutral-950 active:text-white
            focus-visible:ring-0 focus-visible:ring-offset-0
            cursor-pointer
          ">
					{open ? <X className="h-6 w-6" /> : <Plus className="h-6 w-6" />}

					<span className="sr-only">
						{open ? 'Close Actions' : 'Open Actions'}
					</span>
				</Button>
			</div>

			<TransactionDialog
				type={transactionType}
				transaction={null}
				open={transactionType !== null}
				onOpenChange={handleDialogClose}
				onCreated={() => {
					window.location.reload();
				}}
			/>
		</>
	);
}
