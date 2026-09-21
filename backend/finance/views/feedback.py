from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.core.mail import send_mail


class FeedbackView(APIView):
    permission_classes = (IsAuthenticated,)

    def post(self, request):
        feedback_type = request.data.get("type")
        message = request.data.get("message")
        subject = f"New {feedback_type} received"

        user = request.user

        email_message = f"""
            User: {user.username}
            Email: {user.email}

            Message:
            {message}
            """
        if not feedback_type or not message:
            return Response(
                {"error": "Type and message are required"},
                status=400,
            )
        if feedback_type not in ["bug", "suggestion"]:
            return Response({"error": "Invalid type of feedback"}, status=400)

        send_mail(subject, email_message, user.email, ["hugohadden@proton.me"])

        return Response({"message": "Feedback received"})
