import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { confirmEmailChange } from '@/api/account';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { usePreferences } from '@/context/PreferencesContext';

export default function ConfirmEmailChange() {
	const { uid, token } = useParams();
	const { t } = usePreferences();
	const [status, setStatus] = useState('loading');

	useEffect(() => {
		confirmEmailChange(uid, token)
			.then(() => setStatus('success'))
			.catch(() => setStatus('error'));
	}, [uid, token]);

	return (
		<div className="flex min-h-svh items-center justify-center bg-background p-4">
			<Card className="w-full max-w-md">
				<CardHeader>
					<CardTitle>{t('settings.account')}</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4 text-sm">
					<p>{t(`settings.emailConfirmation.${status}`)}</p>
					{status !== 'loading' && (
						<Button render={<Link to="/login" />}>{t('auth.login')}</Button>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
