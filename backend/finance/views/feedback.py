from django.conf import settings
from django.core.mail import EmailMessage
from django.utils import timezone
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView

MAX_MESSAGE_LENGTH = 2000
VALID_FEEDBACK_TYPES = {"bug", "suggestion"}


class FeedbackView(APIView):
    permission_classes = (IsAuthenticated,)
    throttle_classes = (ScopedRateThrottle,)
    throttle_scope = "feedback"

    def post(self, request):
        feedback_type = request.data.get("type")
        message = request.data.get("message")

        if not isinstance(feedback_type, str):
            return Response({"error": "Invalid feedback type"}, status=400)

        feedback_type = feedback_type.strip().lower()

        if feedback_type not in VALID_FEEDBACK_TYPES:
            return Response({"error": "Invalid feedback type"}, status=400)

        if not isinstance(message, str):
            return Response({"error": "Invalid feedback message"}, status=400)

        message = message.strip()

        if not message:
            return Response(
                {"error": "Feedback message is required"},
                status=400,
            )

        if len(message) > MAX_MESSAGE_LENGTH:
            return Response(
                {"error": "Feedback message is too long"},
                status=400,
            )

        email_message = (
            "Recebeste um novo feedback da FinanceApp.\n\n"
            f"Tipo: {feedback_type.title()}\n"
            f"Utilizador: {request.user.username}\n"
            f"Email: {request.user.email}\n"
            f"Data: {timezone.now().strftime('%d/%m/%Y às %H:%M UTC')}\n\n"
            "Mensagem:\n"
            "----------------------------------------\n"
            f"{message}\n"
            "----------------------------------------\n\n"
            "Podes responder diretamente a este email para contactar o utilizador."
        )

        email = EmailMessage(
            subject=f"[FinanceApp] Novo {feedback_type}: {request.user.username}",
            body=email_message,
            from_email=settings.FEEDBACK_FROM_EMAIL,
            to=[settings.FEEDBACK_RECIPIENT],
            reply_to=[request.user.email],
        )
        email.send(fail_silently=False)

        return Response({"message": "Feedback received"})
