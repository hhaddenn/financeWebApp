'use client';

import { useState } from 'react';
import { ArrowLeftRight, Minus, Plus, X } from 'lucide-react';

import { Button } from '@/components/ui/button';

export function TransactionActionMenu() {
	const [open, setOpen] = useState(false);

	return (
		<div className="fixed bottom-6 right-6 z-50 flex flex-col items-center gap-3">
			{open && (
				<div className="flex flex-col items-center gap-3">
					<button
						type="button"
						onClick={() => {
							console.log('Adicionar');
							setOpen(false);
						}}
						className="
							flex h-12 w-12 items-center justify-center rounded-full
							bg-emerald-600 text-white shadow-md
							transition-transform
							hover:scale-105 active:scale-95
							hover:bg-emerald-600 hover:text-white
							focus:bg-emerald-600 focus:text-white
							focus-visible:outline-none focus-visible:ring-0
							cursor-pointer
						">
						<Plus className="h-5 w-5 text-white" />
						<span className="sr-only">Adicionar</span>
					</button>

					<button
						type="button"
						onClick={() => {
							console.log('Remover');
							setOpen(false);
						}}
						className="
							flex h-12 w-12 items-center justify-center rounded-full
							bg-red-600 text-white shadow-md
							transition-transform
							hover:scale-105 active:scale-95
							hover:bg-red-600 hover:text-white
							focus:bg-red-600 focus:text-white
							focus-visible:outline-none focus-visible:ring-0
							cursor-pointer
						">
						<Minus className="h-5 w-5 text-white" />
						<span className="sr-only">Remover</span>
					</button>

					<button
						type="button"
						onClick={() => {
							console.log('Trocar conta');
							setOpen(false);
						}}
						className="
							flex h-12 w-12 items-center justify-center rounded-full
							bg-muted text-foreground shadow-md
							transition-transform
							hover:scale-105 active:scale-95
							hover:bg-muted hover:text-foreground
							focus:bg-muted focus:text-foreground
							focus-visible:outline-none focus-visible:ring-0
							cursor-pointer
						">
						<ArrowLeftRight className="h-5 w-5 text-foreground" />
						<span className="sr-only">Trocar conta</span>
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
				{open ? (
					<X className="h-6 w-6 text-white" />
				) : (
					<Plus className="h-6 w-6 text-white" />
				)}

				<span className="sr-only">{open ? 'Fechar ações' : 'Abrir ações'}</span>
			</Button>
		</div>
	);
}
