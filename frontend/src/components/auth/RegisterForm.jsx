import { useActionState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { register } from '../../api/auth';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';
import {
	Field,
	FieldDescription,
	FieldGroup,
	FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';

export default function RegisterForm({ className, ...props }) {
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
				const data = error.response?.data;

				if (!data) {
					return {
						success: false,
						error: 'Something went wrong. Please try again.',
					};
				}

				// DRF validation errors
				const messages = Object.values(data)
					.flat()
					.filter((message) => typeof message === 'string');

				return {
					success: false,
					error:
						messages.length > 0
							? messages.join(' ')
							: 'Something went wrong. Please try again.',
				};
			}
		},
		null,
	);

	return (
		<div
			className={cn('flex w-full max-w-sm flex-col gap-6', className)}
			{...props}>
			<Card className="w-full">
				<CardHeader className="text-center">
					<CardTitle className="text-xl">Create your account</CardTitle>

					<CardDescription>
						Enter your details below to create your account
					</CardDescription>
				</CardHeader>

				<CardContent>
					<form action={formAction}>
						<FieldGroup>
							{/* Username */}
							<Field>
								<FieldLabel htmlFor="username">Username</FieldLabel>

								<Input
									id="username"
									name="username"
									type="text"
									placeholder="Username"
									required
									disabled={isPending}
								/>
							</Field>

							{/* Email */}
							<Field>
								<FieldLabel htmlFor="email">Email</FieldLabel>

								<Input
									id="email"
									name="email"
									type="email"
									placeholder="m@example.com"
									required
									disabled={isPending}
								/>
							</Field>

							{/* Passwords */}
							<Field>
								<Field className="grid grid-cols-2 gap-4">
									<Field>
										<FieldLabel htmlFor="password">Password</FieldLabel>

										<Input
											id="password"
											name="password"
											type="password"
											required
											disabled={isPending}
										/>
									</Field>

									<Field>
										<FieldLabel htmlFor="confirmPassword">
											Confirm Password
										</FieldLabel>

										<Input
											id="confirmPassword"
											name="confirmPassword"
											type="password"
											required
											disabled={isPending}
										/>
									</Field>
								</Field>

								<FieldDescription>
									Must be at least 8 characters long.
								</FieldDescription>
							</Field>

							{/* Error */}
							{state?.error && (
								<FieldDescription className="text-center text-red-500">
									{state.error}
								</FieldDescription>
							)}

							{/* Submit */}
							<Field>
								<Button type="submit" disabled={isPending}>
									{isPending ? 'Creating account...' : 'Create Account'}
								</Button>

								<FieldDescription className="text-center">
									Already have an account?{' '}
									<Link to="/login" className="underline underline-offset-4">
										Sign in
									</Link>
								</FieldDescription>
							</Field>
						</FieldGroup>
					</form>
				</CardContent>
			</Card>
		</div>
	);
}
