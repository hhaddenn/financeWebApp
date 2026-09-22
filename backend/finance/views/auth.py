import logging
import secrets
from datetime import timedelta

from django.conf import settings
from django.contrib.auth import authenticate, get_user_model
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth.tokens import default_token_generator
from django.contrib.auth.hashers import check_password, make_password
from django.core.exceptions import ValidationError
from django.core.mail import send_mail
from django.db import transaction
from django.middleware.csrf import get_token
from django.utils import timezone
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_protect, ensure_csrf_cookie
from rest_framework import generics, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.token_blacklist.models import BlacklistedToken, OutstandingToken
from rest_framework_simplejwt.views import TokenRefreshView

from ..models import LoginChallenge
from ..serializers import RegisterSerializer, UserSerializer

logger = logging.getLogger(__name__)
User = get_user_model()


def _token_response(user):
    refresh_token = RefreshToken.for_user(user)
    response = Response({"access": str(refresh_token.access_token)})
    response.set_cookie(
        key="refresh_token",
        value=str(refresh_token),
        httponly=True,
        secure=settings.COOKIE_SECURE,
        samesite="Lax",
        path="/api/auth/",
    )
    return response


@method_decorator(csrf_protect, name="dispatch")
class CookieTokenObtainPairView(generics.GenericAPIView):
    permission_classes = (AllowAny,)

    def post(self, request, *args, **kwargs):
        username = request.data.get("username", "")
        password = request.data.get("password", "")
        user = authenticate(request, username=username, password=password)

        if user is None:
            inactive_user = User.objects.filter(username__iexact=username).first()
            if inactive_user and inactive_user.check_password(password):
                return Response(
                    {"detail": "Email verification required."},
                    status=status.HTTP_403_FORBIDDEN,
                )
            return Response(
                {"detail": "Invalid username or password."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        code = f"{secrets.randbelow(1_000_000):06d}"
        challenge = LoginChallenge.objects.create(
            user=user,
            code_hash=make_password(code),
            expires_at=timezone.now() + timedelta(minutes=10),
        )

        send_mail(
            subject="Your login verification code",
            message=f"Your login verification code is {code}. It expires in 10 minutes.",
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            fail_silently=False,
        )

        return Response(
            {"challenge_id": str(challenge.id)},
            status=status.HTTP_202_ACCEPTED,
        )


@method_decorator(csrf_protect, name="dispatch")
class VerifyLoginView(generics.GenericAPIView):
    permission_classes = (AllowAny,)

    @transaction.atomic
    def post(self, request, *args, **kwargs):
        challenge_id = request.data.get("challenge_id")
        code = str(request.data.get("code", ""))

        try:
            challenge = LoginChallenge.objects.select_for_update().select_related("user").get(
                pk=challenge_id
            )
        except (LoginChallenge.DoesNotExist, ValueError, TypeError):
            return Response(
                {"detail": "Invalid or expired login code."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if (
            challenge.used
            or challenge.attempts >= 5
            or challenge.expires_at <= timezone.now()
        ):
            return Response(
                {"detail": "Invalid or expired login code."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        challenge.attempts += 1
        challenge.save(update_fields=["attempts"])

        if not check_password(code, challenge.code_hash):
            return Response(
                {"detail": "Invalid or expired login code."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        challenge.used = True
        challenge.save(update_fields=["used"])
        return _token_response(challenge.user)


@method_decorator(csrf_protect, name="dispatch")
class CookieTokenRefreshView(TokenRefreshView):
    permission_classes = (AllowAny,)

    def post(self, request, *args, **kwargs):
        refresh_token = request.COOKIES.get("refresh_token")

        if not refresh_token:
            return Response(
                {"refresh": ["Refresh token cookie not found."]},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        serializer = self.get_serializer(data={"refresh": refresh_token})
        try:
            serializer.is_valid(raise_exception=True)
        except TokenError:
            return Response(
                {"refresh": ["Invalid or blacklisted refresh token."]},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        return Response(serializer.validated_data)


@method_decorator(csrf_protect, name="dispatch")
class LogoutView(generics.GenericAPIView):
    permission_classes = (AllowAny,)

    def post(self, request):
        refresh_token = request.COOKIES.get("refresh_token")

        if refresh_token:
            try:
                token = RefreshToken(refresh_token)
                token.blacklist()
            except TokenError:
                logger.warning("Invalid refresh token during logout", exc_info=True)

        response = Response(
            {"detail": "Successfully logged out."},
            status=status.HTTP_205_RESET_CONTENT,
        )

        response.delete_cookie(
            "refresh_token",
            path="/api/auth/",
        )

        return response


class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = (AllowAny,)

    def perform_create(self, serializer):
        user = serializer.save()
        uid = urlsafe_base64_encode(force_bytes(user.pk))
        token = default_token_generator.make_token(user)
        verification_url = f"{settings.FRONTEND_URL}/verify-email/{uid}/{token}"

        send_mail(
            subject="Confirm your email address",
            message=(
                "Confirm your email address by opening this link:\n\n"
                f"{verification_url}\n\n"
                "This link expires when your account security state changes."
            ),
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            fail_silently=False,
        )


class VerifyEmailView(generics.GenericAPIView):
    permission_classes = (AllowAny,)

    def get(self, request, uid, token):
        try:
            user_id = force_str(urlsafe_base64_decode(uid))
            user = User.objects.get(pk=user_id)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            return Response(
                {"detail": "Invalid or expired verification link."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if user.is_active or not default_token_generator.check_token(user, token):
            return Response(
                {"detail": "Invalid or expired verification link."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user.is_active = True
        user.save(update_fields=["is_active"])

        return Response({"detail": "Email verified successfully."})


@method_decorator(csrf_protect, name="dispatch")
class PasswordResetRequestView(generics.GenericAPIView):
    permission_classes = (AllowAny,)

    def post(self, request, *args, **kwargs):
        email = str(request.data.get("email", "")).strip().lower()
        user = User.objects.filter(email__iexact=email, is_active=True).first()

        if user:
            uid = urlsafe_base64_encode(force_bytes(user.pk))
            token = default_token_generator.make_token(user)
            reset_url = f"{settings.FRONTEND_URL}/reset-password/{uid}/{token}"
            send_mail(
                subject="Reset your password",
                message=(
                    "Reset your password by opening this link:\n\n"
                    f"{reset_url}\n\n"
                    "If you did not request this, you can ignore this email."
                ),
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                fail_silently=False,
            )

        return Response(
            {"detail": "If an account exists for that email, a reset link was sent."}
        )


def _get_user_from_token(uid, token):
    try:
        user_id = force_str(urlsafe_base64_decode(uid))
        user = User.objects.get(pk=user_id)
    except (TypeError, ValueError, OverflowError, User.DoesNotExist):
        return None

    if not user.is_active or not default_token_generator.check_token(user, token):
        return None

    return user


@method_decorator(csrf_protect, name="dispatch")
class PasswordResetConfirmView(generics.GenericAPIView):
    permission_classes = (AllowAny,)

    def post(self, request, uid, token, *args, **kwargs):
        user = _get_user_from_token(uid, token)
        password = str(request.data.get("password", ""))

        if user is None:
            return Response(
                {"detail": "Invalid or expired password reset link."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            validate_password(password, user)
        except ValidationError as error:
            return Response(
                {"password": list(error.messages)},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user.set_password(password)
        user.save(update_fields=["password"])

        for outstanding_token in OutstandingToken.objects.filter(user=user):
            BlacklistedToken.objects.get_or_create(token=outstanding_token)

        return Response({"detail": "Password reset successfully."})


class MeView(generics.RetrieveAPIView):
    serializer_class = UserSerializer
    permission_classes = (IsAuthenticated,)

    def get_object(self):
        return self.request.user


@method_decorator(ensure_csrf_cookie, name="dispatch")
class CsrfTokenView(generics.GenericAPIView):
    permission_classes = (AllowAny,)

    def get(self, request):
        get_token(request)
        return Response({"detail": "CSRF cookie set."})
