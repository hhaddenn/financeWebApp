import re

from django.contrib.auth import get_user_model
from django.core import mail
from django.test import override_settings
from rest_framework.test import APIClient, APITestCase

from finance.models import LoginChallenge

User = get_user_model()


@override_settings(
	EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend",
	FRONTEND_URL="http://frontend.test",
	SECURE_SSL_REDIRECT=False,
)
class AuthenticationTests(APITestCase):
	def setUp(self):
		mail.outbox.clear()

	@override_settings(
		ALLOWED_HOSTS=["financeapi.hugo-hadden.com"],
		CSRF_TRUSTED_ORIGINS=["https://finance.hugo-hadden.com"],
	)
	def test_login_requires_csrf_across_subdomains(self):
		client = APIClient(enforce_csrf_checks=True)

		request_options = {
			"secure": True,
			"HTTP_HOST": "financeapi.hugo-hadden.com",
			"HTTP_ORIGIN": "https://finance.hugo-hadden.com",
		}

		csrf_response = client.get("/api/auth/csrf/", **request_options)

		self.assertEqual(csrf_response.status_code, 200)
		self.assertIn("csrftoken", client.cookies)

		csrf_token = csrf_response.data["csrfToken"]

		# Sem o cabeçalho CSRF, o login deve ser rejeitado.
		rejected = client.post(
			"/api/auth/login/",
			{"username": "invalid", "password": "invalid"},
			format="json",
			**request_options,
		)

		self.assertEqual(rejected.status_code, 403)

		# Com CSRF válido, o pedido chega à validação das credenciais.
		accepted = client.post(
			"/api/auth/login/",
			{"username": "invalid", "password": "invalid"},
			format="json",
			HTTP_X_CSRFTOKEN=csrf_token,
			**request_options,
		)

		self.assertEqual(accepted.status_code, 401)

	def test_csrf_endpoint_returns_token_and_sets_cookie(self):
		response = self.client.get("/api/auth/csrf/")

		self.assertEqual(response.status_code, 200)

		# O token deve estar disponível no JSON.
		self.assertIn("csrfToken", response.data)
		self.assertTrue(response.data["csrfToken"])

		# O Django deve continuar a emitir o cookie CSRF.
		self.assertIn("csrftoken", response.cookies)

		# A resposta não deve ser armazenada em cache.
		self.assertEqual(response["Cache-Control"], "no-store")

	def test_registration_requires_email_verification(self):
		response = self.client.post(
			"/api/auth/register/",
			{
				"username": "new-user",
				"email": "new@example.com",
				"password": "StrongPassword1!",
			},
		)

		self.assertEqual(response.status_code, 201)
		user = User.objects.get(username="new-user")
		self.assertFalse(user.is_active)
		self.assertEqual(len(mail.outbox), 1)
		self.assertNotIn("access", response.data)

		match = re.search(
			r"http://frontend\.test/verify-email/([^/]+)/([^\s]+)", mail.outbox[0].body
		)
		self.assertIsNotNone(match)
		verification = self.client.get(
			f"/api/auth/verify-email/{match.group(1)}/{match.group(2)}/"
		)

		self.assertEqual(verification.status_code, 200)
		user.refresh_from_db()
		self.assertTrue(user.is_active)

	def test_unverified_user_cannot_login(self):
		User.objects.create_user(
			username="inactive",
			email="inactive@example.com",
			password="StrongPassword1!",
			is_active=False,
		)

		response = self.client.post(
			"/api/auth/login/",
			{"username": "inactive", "password": "StrongPassword1!"},
		)

		self.assertEqual(response.status_code, 403)
		self.assertNotIn("access", response.data)

	def test_login_requires_one_time_email_code(self):
		user = User.objects.create_user(
			username="active",
			email="active@example.com",
			password="StrongPassword1!",
		)

		start = self.client.post(
			"/api/auth/login/",
			{"username": user.username, "password": "StrongPassword1!"},
		)

		self.assertEqual(start.status_code, 202)
		self.assertNotIn("access", start.data)
		self.assertEqual(len(mail.outbox), 1)
		code = re.search(r"\b(\d{6})\b", mail.outbox[0].body).group(1)
		challenge_id = start.data["challenge_id"]

		invalid = self.client.post(
			"/api/auth/login/verify/",
			{"challenge_id": challenge_id, "code": "000000"},
		)
		self.assertEqual(invalid.status_code, 400)

		verified = self.client.post(
			"/api/auth/login/verify/",
			{"challenge_id": challenge_id, "code": code},
		)
		self.assertEqual(verified.status_code, 200)
		self.assertIn("access", verified.data)

		reused = self.client.post(
			"/api/auth/login/verify/",
			{"challenge_id": challenge_id, "code": code},
		)
		self.assertEqual(reused.status_code, 400)
		self.assertTrue(LoginChallenge.objects.get(pk=challenge_id).used)

	def test_password_reset_is_generic_and_revokes_old_refresh_tokens(self):
		user = User.objects.create_user(
			username="reset-user",
			email="reset@example.com",
			password="StrongPassword1!",
		)

		generic = self.client.post(
			"/api/auth/password-reset/",
			{"email": "missing@example.com"},
		)
		self.assertEqual(generic.status_code, 200)
		self.assertEqual(len(mail.outbox), 0)

		refresh_start = self.client.post(
			"/api/auth/login/",
			{"username": user.username, "password": "StrongPassword1!"},
		)
		self.assertEqual(refresh_start.status_code, 202)
		code = re.search(r"\b(\d{6})\b", mail.outbox[0].body).group(1)
		login_completed = self.client.post(
			"/api/auth/login/verify/",
			{
				"challenge_id": refresh_start.data["challenge_id"],
				"code": code,
			},
		)
		self.assertEqual(login_completed.status_code, 200)

		reset_request = self.client.post(
			"/api/auth/password-reset/",
			{"email": user.email},
		)
		self.assertEqual(reset_request.status_code, 200)
		reset_email = mail.outbox[-1].body
		match = re.search(
			r"http://frontend\.test/reset-password/([^/]+)/([^\s]+)", reset_email
		)
		self.assertIsNotNone(match)

		reset = self.client.post(
			f"/api/auth/password-reset/confirm/{match.group(1)}/{match.group(2)}/",
			{"password": "NewStrongPassword2!"},
		)
		self.assertEqual(reset.status_code, 200)

		old_refresh = self.client.post("/api/auth/refresh/")
		self.assertEqual(old_refresh.status_code, 401)
