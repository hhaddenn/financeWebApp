export default function Account({ account }) {
	return (
		<div className="card w-96 bg-base-100 shadow-sm">
			<div className="card-body">
				<h2 className="card-title text-2xl">
					{account.name}
				</h2>

				<div className="mt-4">
					<h3 className="text-sm font-semibold text-base-content/60">
						Balance
					</h3>

					<p className="text-2xl font-bold">
						${account.balance}
					</p>
				</div>

				<div className="mt-4">
					<h3 className="text-sm font-semibold text-base-content/60">
						Icon
					</h3>

					<p className="mt-1 text-2xl">
						{account.icon}
					</p>
				</div>

				<div className="card-actions mt-4">
					<button className="btn btn-primary">
						Edit
					</button>
				</div>
			</div>
		</div>
	);
}
