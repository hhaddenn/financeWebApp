import { useActionState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { register } from '@/features/auth/api';

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

const MAX_USERNAME_LENGTH = 150;
const MAX_EMAIL_LENGTH = 254;
const MAX_PASSWORD_LENGTH = 128;

export default function RegisterForm({ className, ...props }) {
	const navigate = useNavigate();
	const { t } = usePreferences();

	const [state, formAction, isPending] = useActionState(
		async (previousState, formData) => {
			const username = String(formData.get('username') ?? '').trim();
			const email = String(formData.get('email') ?? '').trim();
			const password = String(formData.get('password') ?? '');
			const confirmPassword = String(formData.get('confirmPassword') ?? '');

			// Client-side validation.
			// A validação real deve existir também no backend.
			if (!username) {
				return {
					success: false,
					error: t('auth.usernameRequired'),
				};
			}

			if (!email) {
				return {
					success: false,
					error: t('auth.emailRequired'),
				};
			}

			if (!password) {
				return {
					success: false,
					error: t('auth.passwordRequired'),
				};
			}

			if (!confirmPassword) {
				return {
					success: false,
					error: t('auth.passwordRequired'),
				};
			}

			if (password !== confirmPassword) {
				return {
					success: false,
					error: t('auth.passwordsDoNotMatch'),
				};
			}

			if (username.length > MAX_USERNAME_LENGTH) {
				return {
					success: false,
					error: t('auth.invalidUsername'),
				};
			}

			if (email.length > MAX_EMAIL_LENGTH) {
				return {
					success: false,
					error: t('auth.invalidEmail'),
				};
			}

			if (password.length > MAX_PASSWORD_LENGTH) {
				return {
					success: false,
					error: t('auth.invalidPassword'),
				};
			}

			try {
				await register(username, email, password);

				navigate('/login', {
					replace: true,
					state: {
						message: t('auth.accountCreated'),
					},
				});

				return {
					success: true,
					error: null,
				};
			} catch (error) {
				const status = error.response?.status;
				const data = error.response?.data;

				/*
				 * Só mostramos mensagens de validação esperadas
				 * pelo backend.
				 *
				 * Não mostramos error.message porque pode conter
				 * informação técnica da aplicação.
				 */
				if (status === 400 && data) {
					const messages = Object.values(data)
						.flat()
						.filter((message) => typeof message === 'string');

					if (messages.length > 0) {
						return {
							success: false,
							error: messages.join(' '),
						};
					}
				}

				return {
					success: false,
					error: t('auth.genericError'),
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
									autoComplete="username"
									maxLength={MAX_USERNAME_LENGTH}
									required
									disabled={isPending}
									aria-invalid={Boolean(state?.error)}
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
									autoComplete="email"
									maxLength={MAX_EMAIL_LENGTH}
									required
									disabled={isPending}
									aria-invalid={Boolean(state?.error)}
								/>
							</Field>

							{/* Passwords */}
							<Field>
								<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
									<Field>
										<FieldLabel htmlFor="password">
											{t('auth.password')}
										</FieldLabel>

										<Input
											id="password"
											name="password"
											type="password"
											autoComplete="new-password"
											maxLength={MAX_PASSWORD_LENGTH}
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
											autoComplete="new-password"
											maxLength={MAX_PASSWORD_LENGTH}
											required
											disabled={isPending}
										/>
									</Field>
								</div>

								<FieldDescription>
									{t('auth.passwordRequirement')}
								</FieldDescription>
							</Field>

							{/* Error */}
							{state?.error && (
								<FieldDescription
									className="text-center text-destructive"
									role="alert"
									aria-live="polite">
									{state.error}
								</FieldDescription>
							)}

							{/* Submit */}
							<Field>
								<Button type="submit" disabled={isPending} className="w-full">
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
