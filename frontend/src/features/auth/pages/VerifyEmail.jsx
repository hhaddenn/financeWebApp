import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { verifyEmail } from '@/features/auth/api';
import { usePreferences } from '@/context/PreferencesContext';

export default function VerifyEmail() {
	const { uid, token } = useParams();
	const { t } = usePreferences();
	const [status, setStatus] = useState('loading');

	useEffect(() => {
		let isMounted = true;

		verifyEmail(uid, token)
			.then(() => {
				if (isMounted) setStatus('success');
			})
			.catch(() => {
				if (isMounted) setStatus('error');
			});

		return () => {
			isMounted = false;
		};
	}, [uid, token]);

	return (
		<div className="flex min-h-svh items-center justify-center bg-muted p-6">
			<div className="w-full max-w-md rounded-lg border bg-card p-8 text-center shadow-sm">
				<h1 className="text-xl font-semibold">{t('auth.verifyEmailTitle')}</h1>
				<p className="mt-4 text-sm text-muted-foreground">
					{status === 'loading' && t('auth.verifyingEmail')}
					{status === 'success' && t('auth.emailVerified')}
					{status === 'error' && t('auth.verificationFailed')}
				</p>
				{status !== 'loading' && (
					<Link
						to="/login"
						className="mt-6 inline-block text-sm underline underline-offset-4">
						{status === 'success' ? t('auth.login') : t('common.back')}
					</Link>
				)}
			</div>
		</div>
	);
}