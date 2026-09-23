import { useActionState } from 'react';

import { Link, useLocation } from 'react-router-dom';

import { useAuth } from '@/features/auth/AuthContext';

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

export default function LoginForm({ className, ...props }) {
	const { login, completeLogin } = useAuth();
	const { t } = usePreferences();
	const location = useLocation();

	const [state, formAction, isPending] = useActionState(
		async (previousState, formData) => {
			try {
				if (previousState?.challengeId) {
					const code = String(formData.get('code') ?? '').trim();
					const result = await completeLogin(previousState.challengeId, code);

					return {
						success: true,
						data: result,
					};
				}

				const result = await login(
					String(formData.get('username') ?? '').trim(),
					String(formData.get('password') ?? ''),
					formData.get('rememberMe') === 'on',
				);

				return {
					success: false,
					challengeId: result.challenge_id,
					error: null,
				};
			} catch (error) {
				const detail = error.response?.data?.detail;
				const translatedError =
					detail === 'Email verification required.'
						? t('auth.emailNotVerified')
						: detail === 'Invalid or expired login code.'
							? t('auth.invalidLoginCode')
							: t('auth.invalidCredentials');

				return {
					success: false,
					error: translatedError,
				};
			}
		},
		null,
	);

	return (
		<div
			className={cn('flex w-full max-w-sm flex-col gap-6', className)}
			{...props}>
			<Card>
				<CardHeader className="text-center">
					<CardTitle className="text-xl">{t('auth.welcomeBack')}</CardTitle>

					<CardDescription>{t('auth.loginDescription')}</CardDescription>
				</CardHeader>

				<CardContent>
					<form action={formAction}>
						<FieldGroup>
							{/* Registration message */}
							{location.state?.message && (
								<div className="rounded-md bg-green-50 px-4 py-3 text-center text-sm text-green-700">
									{location.state.message}
								</div>
							)}

							{state?.challengeId ? (
								<Field>
									<FieldLabel htmlFor="code">{t('auth.emailCode')}</FieldLabel>
									<Input
										id="code"
										name="code"
										type="text"
										inputMode="numeric"
										pattern="[0-9]{6}"
										maxLength={6}
										autoComplete="one-time-code"
										required
										disabled={isPending}
									/>
									<FieldDescription>
										{t('auth.emailCodeDescription')}
									</FieldDescription>
								</Field>
							) : (
								<>
									<Field>
										<FieldLabel htmlFor="username">{t('auth.username')}</FieldLabel>
										<Input
											id="username"
											name="username"
											type="text"
											placeholder={t('auth.username')}
											autoComplete="username"
											required
											disabled={isPending}
										/>
									</Field>

									<Field>
										<div className="flex items-center">
											<FieldLabel htmlFor="password">{t('auth.password')}</FieldLabel>
											<Link
												to="/forgot-password"
												className="ml-auto text-sm underline-offset-4 hover:underline">
												{t('auth.forgotPassword')}
											</Link>
										</div>
										<Input
											id="password"
											name="password"
											type="password"
											placeholder={t('auth.password')}
											autoComplete="current-password"
											required
											disabled={isPending}
										/>
									</Field>

										<Field orientation="horizontal" className="items-center gap-2">
											<input
												id="rememberMe"
												name="rememberMe"
												type="checkbox"
												className="size-4 accent-primary"
											/>
											<FieldLabel htmlFor="rememberMe" className="cursor-pointer">
												{t('auth.rememberMe')}
											</FieldLabel>
										</Field>
								</>
							)}

							{/* Error */}
							{state?.error && (
								<FieldDescription className="text-center text-destructive">
									{state.error}
								</FieldDescription>
							)}

							{/* Submit */}
							<Field>
								<Button
									type="submit"
									disabled={isPending}
									className="w-full hover:cursor-pointer">
									{isPending
										? t('auth.loggingIn')
										: state?.challengeId
											? t('auth.verifyCode')
											: t('auth.login')}
								</Button>
							</Field>

							{/* Success */}
							{state?.success && (
								<FieldDescription className="text-center text-green-600">
									{t('auth.loginSucceeded')}
								</FieldDescription>
							)}

							{/* Register */}
							<FieldDescription className="text-center">
								{t('auth.noAccount')}{' '}
								<Link to="/register" className="underline underline-offset-4">
									{t('auth.signUp')}
								</Link>
							</FieldDescription>
						</FieldGroup>
					</form>
				</CardContent>
			</Card>
		</div>
	);
}
