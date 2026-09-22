import { useActionState } from 'react';
import { Link } from 'react-router-dom';

import { requestPasswordReset } from '@/features/auth/api';
import { usePreferences } from '@/context/PreferencesContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';

export default function ForgotPassword() {
	const { t } = usePreferences();
	const [state, formAction, isPending] = useActionState(
		async (previousState, formData) => {
			try {
				await requestPasswordReset(String(formData.get('email') ?? '').trim());
				return { success: true };
			} catch {
				return { success: false, error: t('auth.genericError') };
			}
		},
		null,
	);

	return (
		<div className="flex min-h-svh items-center justify-center bg-muted p-6">
			<Card className="w-full max-w-md">
				<CardHeader className="text-center">
					<CardTitle>{t('auth.forgotPasswordTitle')}</CardTitle>
					<CardDescription>{t('auth.forgotPasswordDescription')}</CardDescription>
				</CardHeader>
				<CardContent>
					<form action={formAction}>
						<FieldGroup>
							<Field>
								<FieldLabel htmlFor="email">{t('auth.email')}</FieldLabel>
								<Input
									id="email"
									name="email"
									type="email"
									autoComplete="email"
									required
									disabled={isPending}
								/>
							</Field>
							{state?.success && (
								<FieldDescription className="text-center text-green-600">
									{t('auth.forgotPasswordSent')}
								</FieldDescription>
							)}
							{state?.error && (
								<FieldDescription className="text-center text-destructive">
									{state.error}
								</FieldDescription>
							)}
							<Button type="submit" disabled={isPending} className="w-full">
								{t('auth.resetPassword')}
							</Button>
							<FieldDescription className="text-center">
								<Link to="/login" className="underline underline-offset-4">
									{t('common.back')}
								</Link>
							</FieldDescription>
						</FieldGroup>
					</form>
				</CardContent>
			</Card>
		</div>
	);
}
