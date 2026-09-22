import { useState } from 'react';

import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

import { BugIcon, LightbulbIcon } from 'lucide-react';

import { sendFeedback } from '@/api/feedback';
import { usePreferences } from '@/context/PreferencesContext';

export function FeedbackDialog({ open, onOpenChange, type }) {
	const { t } = usePreferences();

	const [message, setMessage] = useState('');
	const [loading, setLoading] = useState(false);

	const isBug = type === 'bug';

	const handleSubmit = async (e) => {
		e.preventDefault();

		if (!message.trim()) {
			return;
		}

		try {
			setLoading(true);

			await sendFeedback({
				type,
				message,
			});

			setMessage('');
			onOpenChange(false);
		} catch (error) {
			console.error(error);
		} finally {
			setLoading(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						{isBug ? (
							<BugIcon className="size-5" />
						) : (
							<LightbulbIcon className="size-5" />
						)}

						{isBug ? t('feedback.reportBug') : t('feedback.sendSuggestion')}
					</DialogTitle>

					<DialogDescription>
						{isBug
							? t('feedback.bugDescription')
							: t('feedback.suggestionDescription')}
					</DialogDescription>
				</DialogHeader>

				<form onSubmit={handleSubmit} className="space-y-4">
					<div className="space-y-2">
						<Label htmlFor="feedback-message">
							{isBug
								? t('feedback.whatWentWrong')
								: t('feedback.yourSuggestion')}
						</Label>

						<Textarea
							id="feedback-message"
							placeholder={
								isBug
									? t('feedback.bugPlaceholder')
									: t('feedback.suggestionPlaceholder')
							}
							value={message}
							onChange={(e) => setMessage(e.target.value)}
							rows={6}
							disabled={loading}
						/>
					</div>

					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							onClick={() => onOpenChange(false)}
							disabled={loading}>
							{t('common.cancel')}
						</Button>

						<Button type="submit" disabled={loading || !message.trim()}>
							{loading ? t('feedback.sending') : t('feedback.send')}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
