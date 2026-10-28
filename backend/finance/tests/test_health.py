from django.conf import settings
from django.test import SimpleTestCase, override_settings
from django.urls import reverse


class HealthCheckTests(SimpleTestCase):
	def test_health_check_returns_ok(self):
		response = self.client.get(reverse("health-check"))

		self.assertEqual(response.status_code, 200)
		self.assertEqual(response.json(), {"status": "ok"})

	def test_health_check_rejects_post(self):
		response = self.client.post(reverse("health-check"))

		self.assertEqual(response.status_code, 405)

	@override_settings(SECURE_SSL_REDIRECT=True)
	def test_health_check_works_with_https_redirect_enabled(self):
		self.assertIn("127.0.0.1", settings.ALLOWED_HOSTS)

		response = self.client.get(
			reverse("health-check"),
			HTTP_HOST="127.0.0.1",
			secure=False,
		)

		self.assertEqual(response.status_code, 200)
		self.assertEqual(response.json(), {"status": "ok"})

		admin_response = self.client.get(
			"/admin/",
			HTTP_HOST="127.0.0.1",
			secure=False,
		)

		self.assertEqual(admin_response.status_code, 301)
		self.assertTrue(admin_response["Location"].startswith("https://"))
