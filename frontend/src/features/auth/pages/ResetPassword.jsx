import { useActionState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { confirmPasswordReset } from '@/features/auth/api';
import { usePreferences } from '@/context/PreferencesContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';

export default function ResetPassword() {
	const { uid, token } = useParams();
	const { t } = usePreferences();
	const [state, formAction, isPending] = useActionState(
		async (previousState, formData) => {
			const password = String(formData.get('password') ?? '');
			const confirmPassword = String(formData.get('confirmPassword') ?? '');

			if (password !== confirmPassword) {
				return { success: false, error: t('auth.passwordsDoNotMatch') };
			}

			try {
				await confirmPasswordReset(uid, token, password);
				return { success: true };
			} catch (error) {
				const messages = Object.values(error.response?.data ?? {})
					.flat()
					.filter((message) => typeof message === 'string');
				return {
					success: false,
					error: messages[0] || t('auth.passwordResetFailed'),
				};
			}
		},
		null,
	);

	return (
		<div className="flex min-h-svh items-center justify-center bg-muted p-6">
			<Card className="w-full max-w-md">
				<CardHeader className="text-center">
					<CardTitle>{t('auth.passwordResetTitle')}</CardTitle>
					<CardDescription>{t('auth.passwordRequirement')}</CardDescription>
				</CardHeader>
				<CardContent>
					{state?.success ? (
						<div className="text-center">
							<p className="text-sm text-green-600">{t('auth.passwordResetSuccess')}</p>
							<Link
								to="/login"
								className="mt-6 inline-block text-sm underline underline-offset-4">
								{t('auth.login')}
							</Link>
						</div>
					) : (
						<form action={formAction}>
							<FieldGroup>
								<Field>
									<FieldLabel htmlFor="password">{t('auth.newPassword')}</FieldLabel>
									<Input
										id="password"
										name="password"
										type="password"
										autoComplete="new-password"
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
										required
										disabled={isPending}
									/>
								</Field>
								{state?.error && (
									<FieldDescription className="text-center text-destructive">
										{state.error}
									</FieldDescription>
								)}
								<Button type="submit" disabled={isPending} className="w-full">
									{t('auth.resetPassword')}
								</Button>
							</FieldGroup>
						</form>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
