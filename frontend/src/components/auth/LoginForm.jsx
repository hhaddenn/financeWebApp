import { useActionState } from 'react';
import { login } from '../../services';

export default function LoginForm({ onLoginSuccess }) {
	const [state, formAction, isPending] = useActionState(
		async (previousState, formData) => {
			const username = formData.get('username');
			const password = formData.get('password');

			try {
				const result = await login(username, password);

				onLoginSuccess();

				return {
					success: true,
					data: result,
				};
			} catch (error) {
				return {
					success: false,
					error: error.response?.data?.detail || error.message,
				};
			}
		},
		null,
	);

	return (
		<div className="w-96 mx-auto p-4 bg-white rounded shadow-md">
			<form action={formAction} className="flex flex-col gap-4">
				<div>
					<label htmlFor="username" className="block text-sm font-medium">
						Username
					</label>

					<input
						type="text"
						id="username"
						name="username"
						className="block w-full p-2 border border-gray-300 rounded"
						placeholder="Username"
						required
					/>
				</div>

				<div>
					<label htmlFor="password" className="block text-sm font-medium">
						Password
					</label>

					<input
						type="password"
						id="password"
						name="password"
						className="block w-full p-2 border border-gray-300 rounded"
						placeholder="Password"
						required
					/>
				</div>

				<button
					type="submit"
					disabled={isPending}
					className="bg-blue-500 hover:bg-blue-700 hover:cursor-pointer text-white font-bold py-2 px-4 rounded">
					{isPending ? 'Loading...' : 'Login'}
				</button>

				{state?.success && <p className="text-green-500">Login Succeed!</p>}

				{state?.error && <p className="text-red-500">{state.error}</p>}
			</form>
		</div>
	);
}
