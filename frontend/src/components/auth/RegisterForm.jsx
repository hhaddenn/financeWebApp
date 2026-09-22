import { useActionState } from 'react';

import { Link, useNavigate } from 'react-router-dom';

import { register } from '../../api/auth';

import { usePreferences } from '@/context/PreferencesContext';

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
	const { t } = usePreferences();

	const [state, formAction, isPending] = useActionState(
		async (previousState, formData) => {
			const username = formData.get('username');
			const email = formData.get('email');
			const password = formData.get('password');
			const confirmPassword = formData.get('confirmPassword');

			if (password !== confirmPassword) {
				return {
					success: false,
					error: t('auth.passwordsDoNotMatch'),
				};
			}

			try {
				await register(username, email, password);

				navigate('/login', {
					state: {
						message: t('auth.accountCreated'),
					},
				});

				return { success: true };
			} catch (error) {
				const data = error.response?.data;

				if (!data) {
					return {
						success: false,
						error: t('auth.genericError'),
					};
				}

				// DRF validation errors
				const messages = Object.values(data)
					.flat()
					.filter((message) => typeof message === 'string');

				return {
					success: false,
					error:
						messages.length > 0 ? messages.join(' ') : t('auth.genericError'),
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
					<CardTitle className="text-xl">{t('auth.createAccount')}</CardTitle>

					<CardDescription>
						{t('auth.createAccountDescription')}
					</CardDescription>
				</CardHeader>

				<CardContent>
					<form action={formAction}>
						<FieldGroup>
							{/* Username */}
							<Field>
								<FieldLabel htmlFor="username">{t('auth.username')}</FieldLabel>

								<Input
									id="username"
									name="username"
									type="text"
									placeholder={t('auth.username')}
									required
									disabled={isPending}
								/>
							</Field>

							{/* Email */}
							<Field>
								<FieldLabel htmlFor="email">{t('auth.email')}</FieldLabel>

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
										<FieldLabel htmlFor="password">
											{t('auth.password')}
										</FieldLabel>

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
											{t('auth.confirmPassword')}
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
									{t('auth.passwordRequirement')}
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
									{isPending
										? t('auth.creatingAccount')
										: t('auth.createAccount')}
								</Button>

								<FieldDescription className="text-center">
									{t('auth.alreadyHaveAccount')}{' '}
									<Link to="/login" className="underline underline-offset-4">
										{t('auth.signIn')}
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
