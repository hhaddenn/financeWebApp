import { useEffect, useState } from 'react';

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
import { BugIcon, LightbulbIcon, Loader2 } from 'lucide-react';

import { sendFeedback } from '@/api/feedback';
import { usePreferences } from '@/context/PreferencesContext';

const MAX_MESSAGE_LENGTH = 2000;

export function FeedbackDialog({ open, onOpenChange, type }) {
  const { t } = usePreferences();

  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isBug = type === 'bug';

  // Garantir que só existem tipos válidos.
  const feedbackType = isBug ? 'bug' : 'suggestion';

  // Limpar o formulário quando o dialog fecha.
  useEffect(() => {
    if (!open) {
      setMessage('');
      setError('');
    }
  }, [open]);

  const trimmedMessage = message.trim();
  const isValid = trimmedMessage.length > 0;

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (loading) {
      return;
    }

    if (!trimmedMessage) {
      setError(t('feedback.messageRequired'));
      return;
    }

    if (trimmedMessage.length > MAX_MESSAGE_LENGTH) {
      setError(t('feedback.messageTooLong'));
      return;
    }

    try {
      setLoading(true);
      setError('');

      await sendFeedback({
        type: feedbackType,
        message: trimmedMessage,
      });

      setMessage('');
      onOpenChange(false);
    } catch {
      // Não expor detalhes internos do erro ao utilizador.
      setError(t('feedback.sendError'));
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (nextOpen) => {
    if (loading) {
      return;
    }

    onOpenChange(nextOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isBug ? (
              <BugIcon
                className="size-5"
                aria-hidden="true"
              />
            ) : (
              <LightbulbIcon
                className="size-5"
                aria-hidden="true"
              />
            )}

            {isBug
              ? t('feedback.reportBug')
              : t('feedback.sendSuggestion')}
          </DialogTitle>

          <DialogDescription>
            {isBug
              ? t('feedback.bugDescription')
              : t('feedback.suggestionDescription')}
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit}
          className="space-y-4"
          noValidate
        >
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor="feedback-message">
                {isBug
                  ? t('feedback.whatWentWrong')
                  : t('feedback.yourSuggestion')}
              </Label>

              <span
                className={`text-xs ${
                  message.length > MAX_MESSAGE_LENGTH
                    ? 'text-destructive'
                    : 'text-muted-foreground'
                }`}
              >
                {message.length}/{MAX_MESSAGE_LENGTH}
              </span>
            </div>

            <Textarea
              id="feedback-message"
              name="message"
              placeholder={
                isBug
                  ? t('feedback.bugPlaceholder')
                  : t('feedback.suggestionPlaceholder')
              }
              value={message}
              onChange={(event) => {
                setMessage(event.target.value);

                if (error) {
                  setError('');
                }
              }}
              maxLength={MAX_MESSAGE_LENGTH}
              rows={6}
              disabled={loading}
              aria-invalid={Boolean(error)}
              aria-describedby={error ? 'feedback-error' : undefined}
              autoFocus
            />

            {error && (
              <p
                id="feedback-error"
                className="text-sm text-destructive"
                role="alert"
              >
                {error}
              </p>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={loading}
            >
              {t('common.cancel')}
            </Button>

            <Button
              type="submit"
              disabled={loading || !isValid}
            >
              {loading && (
                <Loader2
                  className="mr-2 size-4 animate-spin"
                  aria-hidden="true"
                />
              )}

              {loading
                ? t('feedback.sending')
                : t('feedback.send')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}