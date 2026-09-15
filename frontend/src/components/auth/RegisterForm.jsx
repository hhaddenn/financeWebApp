import { useActionState } from 'react';
import { register } from '../../api/auth';
import { Link, useNavigate } from 'react-router-dom';

export default function RegisterForm() {
	const navigate = useNavigate();

	const [state, formAction, isPending] = useActionState(
		async (previousState, formData) => {
			const username = formData.get('username');
			const email = formData.get('email');
			const password = formData.get('password');
			const confirmPassword = formData.get('confirmPassword');

			if (password !== confirmPassword) {
				return {
					success: false,
					error: "Passwords don't match!",
				};
			}

			try {
				await register(username, email, password);

				navigate('/login', {
					state: {
						message: 'Account created successfully! You can now log in.',
					},
				});

				return { success: true };
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
					<label htmlFor="email" className="block text-sm font-medium">
						Email
					</label>

					<input
						type="email"
						id="email"
						name="email"
						className="block w-full p-2 border border-gray-300 rounded"
						placeholder="Email"
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

				<div>
					<label
						htmlFor="confirmPassword"
						className="block text-sm font-medium">
						Confirm Password
					</label>

					<input
						type="password"
						id="confirmPassword"
						name="confirmPassword"
						className="block w-full p-2 border border-gray-300 rounded"
						placeholder="Confirm Password"
						required
					/>
				</div>

				<button
					type="submit"
					disabled={isPending}
					className="bg-blue-500 hover:bg-blue-700 hover:cursor-pointer text-white font-bold py-2 px-4 rounded">
					{isPending ? 'Loading...' : 'Create Account'}
				</button>
				<Link
					to="/login"
					className="text-blue-500 hover:text-blue-700 text-sm text-center">
					Already have an account?
				</Link>

				{state?.success && <p className="text-green-500">Account created!</p>}

				{state?.error && <p className="text-red-500">{state.error}</p>}
			</form>
		</div>
	);
}
