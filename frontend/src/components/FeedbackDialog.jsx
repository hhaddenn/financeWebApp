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

export function FeedbackDialog({ open, onOpenChange, type }) {
	const [message, setMessage] = useState('');
	const [loading, setLoading] = useState(false);

	const isBug = type === 'bug';

	const handleSubmit = async (e) => {
		e.preventDefault();

		if (!message.trim()) return;

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

						{isBug ? 'Report a bug' : 'Send a suggestion'}
					</DialogTitle>

					<DialogDescription>
						{isBug
							? 'Tell us about a problem you encountered.'
							: 'Have an idea that could improve the app? Let us know.'}
					</DialogDescription>
				</DialogHeader>

				<form onSubmit={handleSubmit} className="space-y-4">
					<div className="space-y-2">
						<Label htmlFor="feedback-message">
							{isBug ? 'What went wrong?' : 'Your suggestion'}
						</Label>

						<Textarea
							id="feedback-message"
							placeholder={
								isBug
									? 'Describe the problem you encountered...'
									: 'Tell us about your idea...'
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
							Cancel
						</Button>

						<Button type="submit" disabled={loading || !message.trim()}>
							{loading ? 'Sending...' : 'Send'}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
