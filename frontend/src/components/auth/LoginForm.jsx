import { useActionState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function LoginForm() {
	const { login } = useAuth();
	const location = useLocation();

	const [state, formAction, isPending] = useActionState(
		async (previousState, formData) => {
			const username = formData.get('username');
			const password = formData.get('password');

			try {
				const result = await login(username, password);

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
			{location.state?.message && (
				<p className="mb-4 text-green-500 text-center">
					{location.state.message}
				</p>
			)}

			<form action={formAction} className="flex flex-col gap-4 text-left">
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

				<Link
					to="/register"
					className="text-blue-500 hover:text-blue-700 text-sm text-center">
					Don't have an account?
				</Link>

				{state?.success && <p className="text-green-500 text-center">Login Succeeded!</p>}

				{state?.error && <p className="text-red-500 text-center">{state.error}</p>}
			</form>
		</div>
	);
}
