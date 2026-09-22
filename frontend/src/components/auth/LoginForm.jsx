import { useActionState } from 'react';

import { Link, useLocation } from 'react-router-dom';

import { useAuth } from '../../context/AuthContext';

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
	const { login } = useAuth();
	const { t } = usePreferences();
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

							{/* Username */}
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

							{/* Password */}
							<Field>
								<div className="flex items-center">
									<FieldLabel htmlFor="password">
										{t('auth.password')}
									</FieldLabel>

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
									{isPending ? t('auth.loggingIn') : t('auth.login')}
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
