import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '@/features/auth/AuthContext';
import { usePreferences } from '@/context/PreferencesContext';
import {
	changePassword,
	getAccount,
	logoutAll,
	requestEmailChange,
	updateUsername,
} from '@/api/account';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function AccountSecurity() {
	const { t } = usePreferences();
	const { logout } = useAuth();
	const navigate = useNavigate();
	const [account, setAccount] = useState(null);
	const [username, setUsername] = useState('');
	const [email, setEmail] = useState('');
	const [currentPassword, setCurrentPassword] = useState('');
	const [newPassword, setNewPassword] = useState('');
	const [confirmPassword, setConfirmPassword] = useState('');
	const [newEmail, setNewEmail] = useState('');
	const [message, setMessage] = useState(null);
	const [error, setError] = useState(null);
	const [saving, setSaving] = useState(false);

	useEffect(() => {
		getAccount()
			.then((data) => {
				setAccount(data);
				setUsername(data.username);
				setEmail(data.email);
			})
			.catch(() => setError(t('settings.accountLoadError')));
	}, [t]);

	const runAction = async (action, successMessage) => {
		try {
			setSaving(true);
			setError(null);
			setMessage(null);
			await action();
			setMessage(successMessage);
		} catch (actionError) {
			setError(actionError.response?.data?.detail || t('settings.accountError'));
		} finally {
			setSaving(false);
		}
	};

	const saveUsername = () =>
		runAction(
			async () => {
				const data = await updateUsername({ username, current_password: currentPassword });
				setAccount(data);
				setCurrentPassword('');
			},
			t('settings.usernameSaved'),
		);

	const savePassword = () =>
		runAction(
			async () => {
				if (newPassword !== confirmPassword) {
					throw { response: { data: { detail: t('auth.passwordsDoNotMatch') } } };
				}
				await changePassword({
					current_password: currentPassword,
					new_password: newPassword,
					confirm_password: confirmPassword,
				});
				setCurrentPassword('');
				setNewPassword('');
				setConfirmPassword('');
				await logout();
				navigate('/login', { replace: true });
			},
			t('settings.passwordSaved'),
		);

	const requestEmail = () =>
		runAction(
			async () => {
				await requestEmailChange({ current_password: currentPassword, new_email: newEmail });
				setCurrentPassword('');
				setNewEmail('');
			},
			t('settings.emailConfirmationSent'),
		);

	const endAllSessions = () =>
		runAction(
			async () => {
				await logoutAll();
				await logout();
				navigate('/login', { replace: true });
			},
			t('settings.sessionsEnded'),
		);

	if (!account) return <Card><CardContent className="py-8 text-sm text-muted-foreground">{t('common.loading')}</CardContent></Card>;

	return (
		<div className="space-y-6">
			{(message || error) && (
				<Alert variant={error ? 'destructive' : 'default'}>
					<AlertTitle>{error ? t('common.error') : t('settings.confirmation')}</AlertTitle>
					<AlertDescription>{error || message}</AlertDescription>
				</Alert>
			)}

			<Card>
				<CardHeader>
					<CardTitle>{t('settings.accountDetails')}</CardTitle>
					<CardDescription>{t('settings.sensitiveActionDescription')}</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="grid gap-2"><Label>{t('auth.username')}</Label><Input value={username} onChange={(event) => setUsername(event.target.value)} /></div>
					<div className="grid gap-2"><Label>{t('auth.email')}</Label><Input value={email} readOnly /></div>
					<div className="grid gap-2"><Label>{t('settings.currentPassword')}</Label><Input type="password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} autoComplete="current-password" /></div>
					<Button disabled={saving || !currentPassword} onClick={saveUsername}>{t('settings.saveUsername')}</Button>
				</CardContent>
			</Card>

			<Card>
				<CardHeader><CardTitle>{t('settings.changeEmail')}</CardTitle><CardDescription>{t('settings.emailChangeDescription')}</CardDescription></CardHeader>
				<CardContent className="space-y-4">
					<Input type="email" placeholder={t('auth.email')} value={newEmail} onChange={(event) => setNewEmail(event.target.value)} />
					<Button disabled={saving || !currentPassword || !newEmail} onClick={requestEmail}>{t('settings.requestEmailChange')}</Button>
				</CardContent>
			</Card>

			<Card>
				<CardHeader><CardTitle>{t('settings.changePassword')}</CardTitle><CardDescription>{t('settings.passwordChangeDescription')}</CardDescription></CardHeader>
				<CardContent className="space-y-4">
					<Input type="password" placeholder={t('auth.newPassword')} value={newPassword} onChange={(event) => setNewPassword(event.target.value)} autoComplete="new-password" />
					<Input type="password" placeholder={t('auth.confirmNewPassword')} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} autoComplete="new-password" />
					{confirmPassword && newPassword !== confirmPassword && <p className="text-sm text-destructive">{t('auth.passwordsDoNotMatch')}</p>}
					<Button disabled={saving || !currentPassword || !newPassword || !confirmPassword || newPassword !== confirmPassword} onClick={savePassword}>{t('settings.changePassword')}</Button>
				</CardContent>
			</Card>

			<Card>
				<CardHeader><CardTitle>{t('settings.security')}</CardTitle><CardDescription>{t('settings.lastLogin')}: {account.last_login ? new Date(account.last_login).toLocaleString() : '-'}</CardDescription></CardHeader>
				<CardContent><Button variant="destructive" disabled={saving} onClick={endAllSessions}>{t('settings.logoutAll')}</Button></CardContent>
			</Card>
		</div>
	);
}
